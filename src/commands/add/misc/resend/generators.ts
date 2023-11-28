// 1. Add page at app/resend/page.tsx
// 2. Add component at components/emails/FirstEmailTemplate.tsx
// 3. Add route handler at app/api/email/route.ts
// 4. Add email utils
// 4. Add email index.ts

import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";

const generateResendPage = () => {
  const { resend } = getFilePaths();
  return `"use client";
import Link from "next/link"
import { emailSchema } from "${formatFilePath(resend.emailUtils, {
    prefix: "alias",
    removeExtension: true,
  })}";
import { useRef, useState } from "react";
import { z } from "zod";

type FormInput = z.infer<typeof emailSchema>;
type Errors = { [K in keyof FormInput]: string[] };

export default function Home() {
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Errors | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const sendEmail = async () => {
    setSending(true);
    setErrors(null);
    try {
      const payload = emailSchema.parse({
        name: nameInputRef.current?.value,
        email: emailInputRef.current?.value,
      });
      console.log(payload);
      const req = await fetch("/api/email", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const { id } = await req.json();
      if (id) alert("Successfully sent!");
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors(err.flatten().fieldErrors as Errors);
      }
    } finally {
      setSending(false);
    }
  };
  return (
    <main className="p-4 md:p-0">
     <div>
      <h1 className="text-2xl font-bold my-4">Send Email with Resend</h1>
      <div>
        <ol className="list-decimal list-inside space-y-1">
          <li>
            <Link
              className="text-primary hover:text-muted-foreground underline"
              href="https://resend.com/signup"
            >
              Sign up
            </Link>{" "}
            or{" "}
            <Link
              className="text-primary hover:text-muted-foreground underline"
              href="https://resend.com/login"
            >
              Login
            </Link>{" "}
            to your Resend account
          </li>
          <li>Add and verify your domain</li>
          <li>
            Create an API Key and add to{" "}
            <span className="ml-1 font-mono font-thin text-neutral-600 bg-neutral-100 p-0.5">
              .env
            </span>
          </li>
          <li>
            Update &quot;from:&quot; in{" "}
            <span className="ml-1 font-mono font-thin text-neutral-600 bg-neutral-100 p-0.5">
              app/api/email/route.ts
            </span>
          </li>
          <li>Send email 🎉</li>
        </ol>
      </div>
     </div>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="space-y-3 pt-4 border-t mt-4"
      >
        {errors && (
          <p className="bg-neutral-50 p-3">{JSON.stringify(errors, null, 2)}</p>
        )}
        <div>
          <label className="text-neutral-700 text-sm">Name</label>
          <input
            type="text"
            placeholder="Tim"
            name="name"
            ref={nameInputRef}
            className={\`
              w-full px-3 py-2 text-sm rounded-md border focus:outline-neutral-700 \${
                !!errors?.name ? "border-red-700" : "border-neutral-200"
              }\`}
          />
        </div>
        <div>
          <label className="text-muted-foreground">Email</label>
          <input
            type="email"
            placeholder="tim@apple.com"
            name="email"
            ref={emailInputRef}
            className={\`
              w-full px-3 py-2 text-sm rounded-md border focus:outline-neutral-700 \${
                !!errors?.email ? "border-red-700" : "border-neutral-200"
              }\`}
          />
        </div>
        <button
          onClick={() => sendEmail()}
          className="text-sm bg-black text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-70"
          disabled={sending}
        >
          {sending ? "sending..." : "Send Email"}
        </button>
      </form>
    </main>
  );
}

`;
};

const generateEmailTemplateComponent = () => {
  return `import * as React from "react";

interface EmailTemplateProps {
  firstName: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
}) => (
  <div>
    <h1>Welcome, {firstName}!</h1>
    <p>
      Lorem ipsum dolor sit amet, officia excepteur ex fugiat reprehenderit enim
      labore culpa sint ad nisi Lorem pariatur mollit ex esse exercitation amet.
      Nisi anim cupidatat excepteur officia. Reprehenderit nostrud nostrud ipsum
      Lorem est aliquip amet voluptate voluptate dolor minim nulla est proident.
      Nostrud officia pariatur ut officia. Sit irure elit esse ea nulla sunt ex
      occaecat reprehenderit commodo officia dolor Lorem duis laboris cupidatat
      officia voluptate. Culpa proident adipisicing id nulla nisi laboris ex in
      Lorem sunt duis officia eiusmod. Aliqua reprehenderit commodo ex non
      excepteur duis sunt velit enim. Voluptate laboris sint cupidatat ullamco
      ut ea consectetur et est culpa et culpa duis.
    </p>
    <hr />
    <p>Sent with help from Resend and Kirimase 😊</p>
  </div>
);
`;
};

const generateApiRoute = () => {
  const { resend } = getFilePaths();
  return `import { EmailTemplate } from "${formatFilePath(
    resend.firstEmailComponent,
    { prefix: "alias", removeExtension: true },
  )}";
import { resend } from "${formatFilePath(resend.libEmailIndex, {
    prefix: "alias",
    removeExtension: true,
  })}";
import { emailSchema } from "${formatFilePath(resend.emailUtils, {
    prefix: "alias",
    removeExtension: true,
  })}";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email } = emailSchema.parse(body);
  try {
    const data = await resend.emails.send({
      from: "Kirimase <onboarding@resend.dev>",
      to: [email],
      subject: "Hello world!",
      react: EmailTemplate({ firstName: name }),
      text: "Email powered by Resend.",
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error });
  }
}
`;
};

const generateEmailIndexTs = () => {
  const {
    shared: { init },
  } = getFilePaths();
  return `import { Resend } from "resend";
import { env } from "${formatFilePath(init.envMjs, {
    prefix: "alias",
    removeExtension: true,
  })}";

export const resend = new Resend(env.RESEND_API_KEY);
`;
};

const generateEmailUtilsTs = () => {
  return `import { z } from "zod";

export const emailSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
});
`;
};

export const resendGenerators = {
  generateResendPage,
  generateEmailTemplateComponent,
  generateApiRoute,
  generateEmailIndexTs,
  generateEmailUtilsTs,
};
