import Content from "../content";
import Features from "../features";
import Hero from "../hero";

export default function MarketingView() {
    return (
        <div className="flex flex-col">
            <Hero />
            <Content />
            <Features />
        </div>

    )
}