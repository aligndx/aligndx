import Content from "../content";
import Features from "../features";
import Hero from "../hero";

export default function MarketingView() {
    return (
        <div className="flex flex-col ">
            <div className="px-20">
                <Hero />
            </div>
            <Features />
            <Content />
        </div>

    )
}