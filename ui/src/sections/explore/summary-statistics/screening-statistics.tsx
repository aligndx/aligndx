import * as React from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card" 

interface ScreeningStatisticsProps extends React.HTMLAttributes<HTMLDivElement> {
}

export default function ScreeningStatistics({...props}: ScreeningStatisticsProps) {
    const pathogens = 2000
    return (
    <Card {...props}>
      <CardHeader>
        <CardDescription />
      </CardHeader>
      <CardContent>
        {pathogens} pathogens being screened
       
      </CardContent> 
    </Card>
  )
}
