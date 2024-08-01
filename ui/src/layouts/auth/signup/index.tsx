import Image from "next/image";
import AuthLayout from "../common";

type Props = {
    children: React.ReactNode;
};

export default function SignUpLayout({ children }: Props) {

    const SignUpImage = <Image
        src="/placeholder.svg"
        alt="Image"
        width="1920"
        height="1080"
        className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
    />
    return (
        <div>
            <AuthLayout sideContent={SignUpImage} reverse>{children}</AuthLayout>
        </div>
    );
}
