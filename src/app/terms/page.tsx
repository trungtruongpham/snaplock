import Link from "next/link";
import { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Terms & Conditions | SnapLock",
  description: "Terms and conditions for using SnapLock wallpaper service",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:py-12">
      <Card className="max-w-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl md:text-3xl font-bold">
            Terms & Conditions
          </CardTitle>
          <CardDescription>
            Last updated: {new Date().toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-p:leading-relaxed prose-headings:mt-8 prose-headings:mb-4">
          <h2 className="text-xl md:text-2xl font-semibold mt-0">
            1. Acceptance of Terms
          </h2>
          <p className="mb-6">
            By accessing or using SnapLock, you agree to be bound by these Terms
            and Conditions. If you do not agree to all the terms and conditions,
            you may not access or use our services.
          </p>

          <h2 className="text-xl md:text-2xl font-semibold">
            2. Description of Service
          </h2>
          <p className="mb-6">
            SnapLock provides a platform for users to discover, download, and
            use wallpapers for personal devices. Our service includes a
            collection of images that can be used as wallpapers on various
            devices.
          </p>

          <h2 className="text-xl md:text-2xl font-semibold">
            3. User Accounts
          </h2>
          <p className="mb-6">
            To access certain features of our service, you may be required to
            create an account. You are responsible for maintaining the
            confidentiality of your account information and for all activities
            that occur under your account.
          </p>

          <h2 className="text-xl md:text-2xl font-semibold">4. User Content</h2>
          <p className="mb-6">
            Users may have the ability to upload content to our platform. By
            uploading content, you grant SnapLock a worldwide, non-exclusive,
            royalty-free license to use, reproduce, modify, adapt, publish,
            translate, and distribute your content.
          </p>

          <h2 className="text-xl md:text-2xl font-semibold">
            5. Intellectual Property
          </h2>
          <p className="mb-6">
            All wallpapers and content available through SnapLock are protected
            by copyright and other intellectual property laws. Users may
            download and use wallpapers for personal, non-commercial use only.
          </p>

          <h2 className="text-xl md:text-2xl font-semibold">
            6. Prohibited Uses
          </h2>
          <p className="mb-6">
            You agree not to use SnapLock for any unlawful purpose or in any way
            that could damage, disable, overburden, or impair our service. You
            may not attempt to gain unauthorized access to any part of the
            service.
          </p>

          <h2 className="text-xl md:text-2xl font-semibold">
            7. Limitation of Liability
          </h2>
          <p className="mb-6">
            SnapLock and its affiliates shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages resulting
            from your access to or use of, or inability to access or use, the
            service.
          </p>

          <h2 className="text-xl md:text-2xl font-semibold">
            8. Changes to Terms
          </h2>
          <p className="mb-6">
            We reserve the right to modify these Terms at any time. Your
            continued use of SnapLock after any changes indicates your
            acceptance of the modified Terms.
          </p>

          <h2 className="text-xl md:text-2xl font-semibold">9. Termination</h2>
          <p className="mb-6">
            We may terminate or suspend your account and access to SnapLock
            immediately, without prior notice or liability, for any reason,
            including if you breach these Terms.
          </p>

          <h2 className="text-xl md:text-2xl font-semibold">
            10. Governing Law
          </h2>
          <p className="mb-6">
            These Terms shall be governed by and construed in accordance with
            the laws of the jurisdiction in which SnapLock operates, without
            regard to its conflict of law provisions.
          </p>

          <Separator className="my-8" />

          <p className="text-sm text-muted-foreground">
            If you have any questions about these Terms, please contact us at{" "}
            <Link href="mailto:support@snaplock.com" className="underline">
              support@snaplock.com
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
