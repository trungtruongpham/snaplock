import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  console.log(
    "Auth callback received with code:",
    code ? "present" : "missing"
  );

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      console.log("Successfully exchanged code for session");
      // Return HTML that will close the popup and notify the parent window
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Successful</title>
            <script>
              function closeAndNotify() {
                console.log("Auth successful, attempting to notify parent and close");
                
                // Send message to parent window first
                if (window.opener) {
                  try {
                    window.opener.postMessage('auth-complete', '*');
                    console.log("Sent auth-complete message to opener");
                  } catch (e) {
                    console.error('Failed to send message to opener:', e);
                  }
                }
                
                // Try to close the window
                try {
                  window.close();
                } catch (e) {
                  console.error('Failed to close window:', e);
                }
                
                // If we're still here after a delay, redirect to home
                setTimeout(function() {
                  console.log("Window still open, redirecting to home");
                  window.location.href = '${origin}';
                }, 1000);
              }
              
              // Run our close function when the page loads
              document.addEventListener('DOMContentLoaded', closeAndNotify);
              // Also try immediately in case DOMContentLoaded already fired
              closeAndNotify();
            </script>
          </head>
          <body>
            <p>Authentication successful! This window should close automatically.</p>
            <p>If it doesn't close, <a href="${origin}">click here to continue</a>.</p>
          </body>
        </html>`,
        {
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    } else {
      console.error("Error exchanging code for session:", error.message);
    }
  }

  // Return error HTML
  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        <title>Authentication Error</title>
        <script>
          function closeAndNotifyError() {
            console.log("Auth failed, attempting to notify parent and close");
            
            // Send error message to parent window first
            if (window.opener) {
              try {
                window.opener.postMessage('auth-error', '*');
                console.log("Sent auth-error message to opener");
              } catch (e) {
                console.error('Failed to send error message to opener:', e);
              }
            }
            
            // Try to close the window
            try {
              window.close();
            } catch (e) {
              console.error('Failed to close window:', e);
            }
            
            // If we're still here after a delay, redirect to login
            setTimeout(function() {
              console.log("Window still open, redirecting to login");
              window.location.href = '${origin}/login';
            }, 1000);
          }
          
          // Run our close function when the page loads
          document.addEventListener('DOMContentLoaded', closeAndNotifyError);
          // Also try immediately in case DOMContentLoaded already fired
          closeAndNotifyError();
        </script>
      </head>
      <body>
        <p>Authentication failed. This window should close automatically.</p>
        <p>If it doesn't close, <a href="${origin}/login">click here to return to login</a>.</p>
      </body>
    </html>`,
    {
      headers: {
        "Content-Type": "text/html",
      },
    }
  );
}
