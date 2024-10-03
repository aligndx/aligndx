import React, { ForwardedRef } from "react";

type ChartContainerProps = React.HTMLAttributes<HTMLDivElement> & {
};

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
    (props, ref: ForwardedRef<HTMLDivElement>) => {
        return (
            <div ref={ref} {...props} />
        );
    }
);


ChartContainer.displayName = "ChartContainer";

export default ChartContainer;
