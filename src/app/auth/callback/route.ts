import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const referrer = request.headers.get("referer") || origin;

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
              // Set a flag in localStorage that the parent window can check
              function setAuthSuccessFlag() {
                try {
                  localStorage.setItem('auth_success', 'true');
                  localStorage.setItem('auth_timestamp', Date.now().toString());
                } catch (e) {
                  // Silent fail - localStorage might be unavailable
                }
              }
              
              // Try to notify parent window
              function notifyParentWindow() {
                if (window.opener) {
                  try {
                    // Try to send to specific origins that might be relevant
                    const possibleOrigins = [
                      window.location.origin,
                      "${process.env.NEXT_PUBLIC_APP_URL || ""}",
                      "https://snapslock.com",
                      "https://www.snapslock.com",
                      "*"
                    ];
                    
                    for (const targetOrigin of possibleOrigins) {
                      if (targetOrigin) {
                        try {
                          window.opener.postMessage('auth-complete', targetOrigin);
                        } catch (e) {
                          // Silent fail - postMessage might be blocked
                        }
                      }
                    }
                  } catch (e) {
                    // Silent fail - opener might be inaccessible
                  }
                }
              }
              
              // Auto-close function that doesn't rely on window.close()
              function attemptAutoClose() {
                // Set the success flag first
                setAuthSuccessFlag();
                
                // Then try to notify parent
                notifyParentWindow();
                
                // Instead of directly calling window.close(), which may be blocked,
                // we'll redirect to a special page that will attempt to self-close
                // or redirect to the main site after a short delay
                setTimeout(function() {
                  window.location.href = '${origin}?auth=success';
                }, 1000);
              }
              
              // Run our function when the page loads
              if (document.readyState === 'complete') {
                attemptAutoClose();
              } else {
                document.addEventListener('DOMContentLoaded', attemptAutoClose);
              }
              // Also try immediately
              attemptAutoClose();
            </script>
          </head>
          <body>
            <p>Authentication successful!</p>
            <p>You can close this window and return to the application.</p>
            <p><a href="${origin}" target="_blank">Click here to open the application</a> if you're not automatically redirected.</p>
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
          // Set a flag in localStorage that the parent window can check
          function setAuthErrorFlag() {
            try {
              localStorage.setItem('auth_error', 'true');
              localStorage.setItem('auth_timestamp', Date.now().toString());
            } catch (e) {
              // Silent fail - localStorage might be unavailable
            }
          }
          
          // Try to notify parent window
          function notifyParentWindowError() {
            if (window.opener) {
              try {
                // Try to send to specific origins that might be relevant
                const possibleOrigins = [
                  window.location.origin,
                  "${process.env.NEXT_PUBLIC_APP_URL || ""}",
                  "https://snapslock.com",
                  "https://www.snapslock.com",
                  "*"
                ];
                
                for (const targetOrigin of possibleOrigins) {
                  if (targetOrigin) {
                    try {
                      window.opener.postMessage('auth-error', targetOrigin);
                    } catch (e) {
                      // Silent fail - postMessage might be blocked
                    }
                  }
                }
              } catch (e) {
                // Silent fail - opener might be inaccessible
              }
            }
          }
          
          // Auto-close function that doesn't rely on window.close()
          function attemptAutoCloseError() {
            // Set the error flag first
            setAuthErrorFlag();
            
            // Then try to notify parent
            notifyParentWindowError();
            
            // Instead of directly calling window.close(), which may be blocked,
            // we'll redirect to the login page after a short delay
            setTimeout(function() {
              window.location.href = '${origin}/login?auth=error';
            }, 1000);
          }
          
          // Run our function when the page loads
          if (document.readyState === 'complete') {
            attemptAutoCloseError();
          } else {
            document.addEventListener('DOMContentLoaded', attemptAutoCloseError);
          }
          // Also try immediately
          attemptAutoCloseError();
        </script>
      </head>
      <body>
        <p>Authentication failed.</p>
        <p>You can close this window and return to the application.</p>
        <p><a href="${origin}/login" target="_blank">Click here to return to login</a> if you're not automatically redirected.</p>
      </body>
    </html>`,
    {
      headers: {
        "Content-Type": "text/html",
      },
    }
  );
}
