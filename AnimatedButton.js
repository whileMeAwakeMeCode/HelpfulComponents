import React from 'react'
import { Button } from 'semantic-ui-react'


const AnimatedButton = ({visible, invisible, className}) => <Button className={`greyAppButton ${className || undefined}`} animated>
    <Button.Content visible>{visible}</Button.Content>
    <Button.Content hidden>{invisible}</Button.Content>
</Button>

export default AnimatedButton