import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  console.log("origin", origin);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Return HTML that will close the popup and notify the parent window
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Successful</title>
            <script>
              // Try to close the window immediately
              window.close();
              
              // If window.close() doesn't work (which is common in modern browsers),
              // try to communicate with the opener and then close
              if (window.opener) {
                try {
                  // Send message to parent window
                  window.opener.postMessage('auth-complete', '*');
                } catch (e) {
                  console.error('Failed to send message to opener:', e);
                }
                // Try closing again after sending the message
                window.close();
              }
              
              // If we're still here, redirect
              setTimeout(function() {
                window.location.href = '${origin}';
              }, 1000);
            </script>
          </head>
          <body>
            <p>Authentication successful! This window should close automatically.</p>
          </body>
        </html>`,
        {
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    }
  }

  // Return error HTML
  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        <title>Authentication Error</title>
        <script>
          // Try to close the window immediately
          window.close();
          
          // If window.close() doesn't work, try to communicate with the opener
          if (window.opener) {
            try {
              window.opener.postMessage('auth-error', '*');
            } catch (e) {
              console.error('Failed to send error message to opener:', e);
            }
            // Try closing again
            window.close();
          }
          
          // If we're still here, redirect
          setTimeout(function() {
            window.location.href = '${origin}/login';
          }, 1000);
        </script>
      </head>
      <body>
        <p>Authentication failed. This window should close automatically.</p>
      </body>
    </html>`,
    {
      headers: {
        "Content-Type": "text/html",
      },
    }
  );
}
