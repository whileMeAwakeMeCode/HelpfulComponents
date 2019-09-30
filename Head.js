import React from 'react';
import {Icon, Header} from 'semantic-ui-react'
/**
 * 
 * @param {object} props Head props 
 * ## Head Props
 *  - as (enum) : SUI Header 'as' prop (default: 'h2')
 *  - textAlign (enum) : SUI Header textAlign prop (default: 'center')
 *  - size (enum) : SUI Header 'size' prop (default: 'large')
 *  - style {object} : header component style
 *  - className (string) : additional className for Header component
 *  - title (string or component) : header title
 *  - titleStyle *only if title is a string*
 *  - content (component) : header content 
 *  - contentStyle {object} : a style object for header content container
 *  - subHeaderStyle {object} : a style object for subHeader content
 *  - subHeaderClassName 
 *  - subHeaderContainerStyle : {object} : a style object for subHeader container
 *  - icon (component or enum) : icon name or custom icon component
 */
const Head = (props) => 
    <Header as={props.as || "h2"} size={props.size || 'large'} className={`flexy ${props.className || ''}`} style={props.style || undefined} textAlign={props.textAlign || 'center'}>
        {
            props.icon 
            && ( typeof props.icon === 'string'
                ? <Icon style={props.iconStyle} name={props.icon} />
                : props.icon
            )
        }
        <Header.Content style={props.contentStyle}>
            <span style={props.titleStyle}>{props.title}</span>
    
            <Header.Subheader style={props.subHeaderContainerStyle} className={props.subHeaderClassName}>
                <span style={props.subHeaderStyle}>{props.content}</span>
            </Header.Subheader>
        </Header.Content>
    </Header>

export default Head;
