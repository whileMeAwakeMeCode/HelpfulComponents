// REACT NATIVE VERSION


import React from 'react';
import {Input, Icon} from 'semantic-ui-react';
import Colors from '../constants/Colors';

/**
 * @notice PROPS :
 *  - data [array] *required*
 *  - dataLen (number) *required* original data length
 *  - dataName (string) *required* a diaplayable name for used data
 *  - style {object} *optional* searcher input component styling
 *  - className *optional* additive classNames
 *  - editList (function) *required* Event fired each time lookForAnswers compute a new array 
 *  - onUpdateSearch (function) *optional* Event fired each time the search input value changes
 */
export default class Searcher extends React.Component {
    state = {
        search: ''
      };

    render() {
        const { search } = this.state;
        const {dataLen , dataName, style, className} = this.props
        return(
            <div> 
                <Input
                    icon={<Icon name="search" color="grey"/>}
                    iconPosition="left"
                    placeholder={(() => { return('rechercher parmis '+dataLen+' '+(dataName || 'réalisation') + (dataLen ? 's' : '' ) +'...'); })()}
                    onChange={this.updateSearch}
                    value={search}
                    className={className}
                    style={{backgroundColor:Colors.anthracite, ...style, color:'white', borderRadius: 15, width: '100%'}}
                />
            </div>
        )
    }


    updateSearch = e => {
        let search = e.target.value
        // call optional "onUpdateSearch" prop if provided
        this.props.onUpdateSearch && this.props.onUpdateSearch(search)
        // set search self state
        this.setState({ search });
        // look for answers and distribute answers to required "editList" props
        this.lookForAnswers(search);
    };

    lookForAnswers = async ($sch) => {
        //console.log('$sch', $sch)
        const $search = $sch.split(' ').filter((s) => s !== '');    // eject empty space from split
        var answers = [];
        var Answers = await new Promise((resolve, reject) => {
            $search.forEach(($w, i) => {
                
                // look for matching for each word ($w)
                this.props.data.forEach(($dta) => {
                    let strDta = JSON.stringify($dta)

                    strDta.toLowerCase().indexOf($w.toLowerCase()) >= 0  // data matching
                    && JSON.stringify(answers).indexOf(strDta) < 0
                    && answers.push($dta);
                })

                i === $search.length-1 && resolve(answers);
            })
        })
        this.props.editList(Answers);  

    }
}
