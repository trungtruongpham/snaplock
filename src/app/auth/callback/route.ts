import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const referrer = request.headers.get("referer") || origin;

  console.log(
    "Auth callback received with code:",
    code ? "present" : "missing"
  );
  console.log("Origin:", origin);
  console.log("Referrer:", referrer);

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
                
                // Try to send message to parent window with wildcard origin for cross-domain support
                if (window.opener) {
                  try {
                    // Try to send to specific origins that might be relevant
                    const possibleOrigins = [
                      window.location.origin,
                      "${process.env.NEXT_PUBLIC_APP_URL || ""}",
                      // Add your custom domain here if known
                      "https://snapslock.com", 
                      // Fallback to wildcard
                      "*"
                    ];
                    
                    for (const targetOrigin of possibleOrigins) {
                      if (targetOrigin) {
                        try {
                          console.log("Attempting to send message to:", targetOrigin);
                          window.opener.postMessage('auth-complete', targetOrigin);
                        } catch (e) {
                          console.error('Failed to send message to ' + targetOrigin, e);
                        }
                      }
                    }
                    
                    console.log("Sent auth-complete messages to possible origins");
                  } catch (e) {
                    console.error('Failed to send messages:', e);
                  }
                  
                  // Store auth success in localStorage as a fallback mechanism
                  try {
                    localStorage.setItem('auth_success', 'true');
                    localStorage.setItem('auth_timestamp', Date.now().toString());
                  } catch (e) {
                    console.error('Failed to set localStorage:', e);
                  }
                } else {
                  console.log("No opener found, cannot send postMessage");
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
                }, 1500);
              }
              
              // Run our close function when the page loads
              if (document.readyState === 'complete') {
                closeAndNotify();
              } else {
                document.addEventListener('DOMContentLoaded', closeAndNotify);
              }
              // Also try immediately
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
            
            // Try to send message to parent window with wildcard origin for cross-domain support
            if (window.opener) {
              try {
                // Try to send to specific origins that might be relevant
                const possibleOrigins = [
                  window.location.origin,
                  "${process.env.NEXT_PUBLIC_APP_URL || ""}",
                  // Add your custom domain here if known
                  "https://yourdomain.com", 
                  // Fallback to wildcard
                  "*"
                ];
                
                for (const targetOrigin of possibleOrigins) {
                  if (targetOrigin) {
                    try {
                      console.log("Attempting to send error message to:", targetOrigin);
                      window.opener.postMessage('auth-error', targetOrigin);
                    } catch (e) {
                      console.error('Failed to send error message to ' + targetOrigin, e);
                    }
                  }
                }
                
                console.log("Sent auth-error messages to possible origins");
              } catch (e) {
                console.error('Failed to send error messages:', e);
              }
              
              // Store auth error in localStorage as a fallback mechanism
              try {
                localStorage.setItem('auth_error', 'true');
                localStorage.setItem('auth_timestamp', Date.now().toString());
              } catch (e) {
                console.error('Failed to set localStorage:', e);
              }
            } else {
              console.log("No opener found, cannot send postMessage");
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
            }, 1500);
          }
          
          // Run our close function when the page loads
          if (document.readyState === 'complete') {
            closeAndNotifyError();
          } else {
            document.addEventListener('DOMContentLoaded', closeAndNotifyError);
          }
          // Also try immediately
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
