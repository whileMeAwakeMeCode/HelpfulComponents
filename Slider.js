import React, {Component} from 'react'
import Slider from 'react-slick';

import { Loader } from 'semantic-ui-react'

/**
 * @title Medias Slider
 * @dev Component responsible for displaying images or videos medias
 * @notice a gallery-item className MUST be used
 * ## Props :
 *  - files : array of File type objects 
 */
class MediasSlider extends Component {
    constructor() {
        super()
        this.state = {
            loading: true,
            slideViews: undefined,
            slideSettings: undefined
        }
    }

    componentDidMount() {
        this.initSlider()
    }
   

    initSlider = async() => {
        const { files } = this.props;

        let slideSettings = await Promise.resolve({
            adaptiveHeight:true,
            autoplay:true,
            autoplaySpeed:3500,           // default 3000
            speed : 700,                  // Slide/Fade animation speed
            centerPadding: '50px',        // default : 50
            dots : true,                  // default : false
            arrows : false,
            //appendArrows : document.querySelector('#slickarrows'),
            //appendDots : dots => <span className="ui center aligned segment" style={{display:'flex', justifyContent:"center"}}>{dots}</span>,
            dotsClass : 'slick-dats',
            respondTo: 'min',
            infinite: true,
            slidesToShow: 1,
            slidesToScroll: 1
        })

        var slideViews = await new Promise((resolve) => {
            var fileElement = (f) => {
                return new Promise(async(fE) => {
                    let Key = await Promise.resolve(Math.floor(Math.random() * 1000000))
                    fE(
                        f.mimetype.indexOf('image') >= 0 
                        ? <div className="padded1" key={Key}><img className="ui centered huge image gallery-item" alt="" src={f.location} /></div>
                        : <div key={Key}><video className="gallery-item" height="100%" controls src={f.location} alt=""></video></div>
                    )
                })
            }
            let views = []

            files && files.length && files.map(async(_f, fi) => {
                let $e = await fileElement(_f)
                views.push($e)

                if (fi === files.length-1)
                    resolve(views)
            })

        })

        this.setState({slideViews, slideSettings, loading:false})
        
    }

    maybeShowLoader = () => {
        const { loading } = this.state
        const {files} = this.props
        let len = (files && files.length) 
        return(
            loading
            ? <span className="flexy flexCenter"><Loader>Chargement de {len} {`média${(len > 1) ? 's' : ''}`}</Loader></span>
            : ''
        )
    }

    maybeShowSlider = () => {
        const { loading , slideSettings, slideViews} = this.state

      
        if (!loading && slideSettings && slideViews)
            return(
                <div><Slider {...slideSettings}>
                    {slideViews}
                </Slider></div>
            )    
        
    }

    render() {
        
        return(
            <div>
                
                {this.maybeShowLoader()}
                {this.maybeShowSlider()}
            
            </div>
        )
    }

}

export default MediasSlider