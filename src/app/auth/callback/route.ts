import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

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
          </head>
          <body>
            <p>Authentication successful! You can close this window.</p>
            <script>
              if (window.opener) {
                // Send message to parent window
                window.opener.postMessage('auth-complete', '${origin}');
                // Close this popup
                window.close();
              } else {
                // If no opener, redirect to home
                window.location.href = '${origin}';
              }
            </script>
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
      </head>
      <body>
        <p>There was an error during authentication. Please try again.</p>
        <script>
          if (window.opener) {
            // Send error message to parent window
            window.opener.postMessage('auth-error', '${origin}');
            // Close this popup
            window.close();
          } else {
            // If no opener, redirect to login
            window.location.href = '${origin}/login';
          }
        </script>
      </body>
    </html>`,
    {
      headers: {
        "Content-Type": "text/html",
      },
    }
  );
}
