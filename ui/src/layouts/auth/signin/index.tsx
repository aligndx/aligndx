import Image from "next/image";
import AuthLayout from "../common";

type Props = {
    children: React.ReactNode;
};

export default function SignInLayout({ children }: Props) {

    const SignInImage = <Image
        src="/placeholder.svg"
        alt="Image"
        width="1920"
        height="1080"
        className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
    />
    return (
        <div>
            <AuthLayout sideContent={SignInImage}>{children}</AuthLayout>
        </div>
    );
}
