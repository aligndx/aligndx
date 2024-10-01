export default function Content() {
    return (
        <div className="relative py-40 bg-cover bg-center" style={{ backgroundImage: "url('/auth/signin.jpg')" }}>
            <div className="absolute inset-0 bg-primary opacity-20"/>
            <div className="relative flex flex-col gap-4 text-center w-3/4 mx-auto">
                <h1 className="text-primary-foreground font-semibold font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
                    Surveillance has never been this easy
                </h1>
                <p className="sm:text-sm md:text-base xl:text-lg text-primary-foreground">
                    AlignDx automates the boring stuff and gets you important insights into your data.
                </p>
            </div>
        </div>
    )
}
