import React from 'react';
import { Header, Icon, Input, Loader } from 'semantic-ui-react';
import Utils from '../constants/Utils'


/**
 * @title ModifiableItem React Component
 * @dev Allow any app's input to set values to db through server with a simple validation
 * @notice PROPS
 *  - ...Header props
 *  - titleStyle {object} : an additional style object for title
 *  - titleClassName (string) : an additional className for title
 *  - inputContainerStyle {object}
 *  - pair {object: key, oldValue} : key/value pair to store
 *  - changeMethodAsync (function) *opt* : async method to use to handle storage instead of default fetchApi using "request" prop. receives {key, newValue, oldValue}. if error, MUST return {error: *any*}
 *  - request (string) *only if no changeMethodAsync prop is provided*:  name of the request (comprehensible by server)
 *  - additionalRequestBodyProp {object} *opt* *only if no changeMethodAsync prop is provided*: merge an object with fetchApi method 'body' prop
 *  - noAlertMode (bool) *optional* : if set to true, DO NOT Alert result (default: false)
 *  - editIconSize (enum) *opt* : size of the edit icon (default: 'small')
 *  - onChangeMethodCalled (function) *optional* : if set, this function will be called each time changeMethodAsync or fetch(request) respond (return {error, response})
 *  - customEditionComponent (react component) *optional* if set, will replace default Input component when editing 
 *    (received props are: changeHandler(fun), value(any))
 *  - restrictEdition *opt* (func): if provided, this method will be called before rendering the edition button (MUST return a boolean) 
 */
export default class ModifiableItem extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            hasChanged : false,
            newValue: undefined,
            isStoring: false,
            isEditing: false
        }
    }

    // componentDidUpdate() {
    //     console.log('UPDATE oldValue', this.state.oldValue)
    // }

    SilverSpan = ({title, controllers, titleStyle, className}) => <li><span className={`silver ${className}`} style={titleStyle}>{title} </span> {controllers} </li>
    SilverSpanNoLi = ({title, controllers, titleStyle, className}) => <span><span className={`silver ${className}`} style={titleStyle}>{title} </span> {controllers} </span>

    changeHandler = (e) => {
        const {pair} = this.props
        const {key, oldValue} = pair || {}
        const NewVal = e.target.value
        // display a 'save changes' button
        //@dev IMPORTANT: oldValue -> keep actual state.oldValue previously set by storeChanges else fetch fails on next storeChanges action (api oldValue is not current for matching if reset here)
        this.setState({key, newValue: NewVal, oldValue: this.state.oldValue || oldValue, hasChanged: NewVal !== oldValue})
    }

    storeChanges = async() => {
        this.setState({isStoring:true})
        //console.log('updating customer', JSON.stringify(this.state)); 
        const {key, newValue, oldValue} = this.state
        const {request, changeMethodAsync, noAlertMode, onChangeMethodCalled, additionalRequestBodyProp} = this.props

        let fetched = changeMethodAsync
            ? await changeMethodAsync({key, newValue, oldValue})
            : await Utils.fetchApi({
                //clientId: this.state.clientId,
                body : {...this.state, ...(additionalRequestBodyProp || {})},
                request
                // default method : POST
            })


        onChangeMethodCalled && onChangeMethodCalled({...fetched, request, key, newValue, oldValue})   // {error, response}
        
        this.setState({isStoring:false, hasChanged:false, oldValue: newValue});

        let success = !fetched.error
        !noAlertMode && alert(success ? 'Succès' : 'Erreur', success ? 'modification effectué' : 'Il y a eu un problème, veuillez réessayer.')
        success && this.toggleEdit()

    }

    toggleEdit = () => this.setState({isEditing: this.state.isEditing ? false : true})

    render() {
        const { hasChanged, isStoring, isEditing, newValue, oldValue } = this.state
        const value = newValue || oldValue || this.props.pair.oldValue
        const SPAN = this[this.props.noLi ? "SilverSpanNoLi" : "SilverSpan"](
            {
                controllers: <span>
                    <Icon className="overable" circular inverted color="grey" name="edit" size={this.props.editIconSize || "small"} onClick={this.toggleEdit.bind(this)} />
                    {
                        hasChanged
                        && <Icon className="overable" circular inverted name="send" color="teal" size="small" onClick={this.storeChanges} />
                    }
                </span>, 
                title: this.props.title,
                titleStyle: this.props.titleStyle, 
                className: this.props.titleClassName
            }
        );

        return(
            <div style={this.props.mainContainerStyle || undefined}>
                   
                {
                    isStoring
                    && <Loader inverted={true}></Loader>
                }
  
                <Header title={this.props.title} as={this.props.as} className={this.props.className} style={{fontSize: '1em'}}>   {/* instead of title={this.props.title}, was ---> {...{...this.props, pair: undefined}} */}
                    <Header.Content>
                        {   
                            (this.props.restrictEdition && typeof this.props.restrictEdition === 'function')
                            ? (
                                this.props.restrictEdition()
                                ? SPAN
                                : ''
                            ) : SPAN
                            
                        }
                    </Header.Content>
                    <Header.Subheader style={this.props.inputContainerStyle}>
                    { 
                        isEditing 
                        ? (
                            this.props.customEditionComponent
                            ? this.props.customEditionComponent(this.changeHandler, value)
                            : <Input onChange={this.changeHandler} value={value} style={{width: '100%', fontSize: 20}}/> 
                        )
                        : <Header style={{fontSize: 20}}>{value}</Header> }
                        
                    </Header.Subheader>
                </Header>
  
            </div>
        )
    }
}

