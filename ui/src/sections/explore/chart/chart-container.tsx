import React, { ForwardedRef } from "react";

type ChartContainerProps = React.HTMLAttributes<HTMLDivElement> & {};

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  (props, ref: ForwardedRef<HTMLDivElement>) => {
    return (
      <>
        {/* Scoped styles */}
        <style>
          {`
            .plot-d6a7b5-figure {
              display: flex;
              flex-direction: row-reverse;
              align-items: self-start;
            }

            .plot-d6a7b5-swatches-wrap {
              display: flex;
              flex-direction: column;
              align-items: self-start;
            }
          `}
        </style>
        <div ref={ref} {...props} />
      </>
    );
  }
);

ChartContainer.displayName = "ChartContainer";

export default ChartContainer;
