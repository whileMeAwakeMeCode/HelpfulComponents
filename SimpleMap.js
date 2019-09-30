import React from 'react'
import { Map, Marker, Popup, TileLayer, Circle } from 'react-leaflet'
import { Loader } from 'semantic-ui-react'
import Utils from '../constants/Utils'

/**
 * ##PROPS
 *  - location [array] or (string: *address*): ex.: [49.6969875, 2.7905661] ou '80700, Roye'
 *  - popup (any): pop up to display when icon is clicked
 *  - height: height of the map container
 *  - width: width of the map container
 */
export default class SimpleMap extends React.Component {
    state = {
        loading: true
    }

    initMap = async(location) => {
        // getCoordinates
        if (typeof location === 'string') { // location is a string
            let {error, response} = await Utils.fetchApi({
                method: 'post', 
                request : 'getCoordinates', 
                body: {location}
            })
            error && this.props.onError()
            this.setState({loading: error ? true : false, coordinates: [response.latitude, response.longitude], location})
        } else {                            // location is a coords object
            this.setState({loading: false, coordinates: [location.latitude, location.longitude]}, location)
        }
    }

    componentDidMount() {
        const {location} = this.props
        this.initMap(location)
    } 

    async componentDidUpdate() {
        if (this.props.location !== this.state.location) {
            // reset map with this.props.location if map is currently set with another location (state)
            await this.initMap(this.props.location)
        }

    }
    render() {
        const {popup, height, width, loading, coordinates} = this.state

        return(
            (loading || !coordinates)
            ? <Loader inverted></Loader>
            : <Map center={coordinates} zoom={9} style={{height, width}}>
                <TileLayer
                    url='https://{s}.tile.osm.org/{z}/{x}/{y}.png'
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors 2'
                />
            
                <Circle
                    center={[49.6969875, 2.7905661]}    // Cie position (80700 Roye)
                    fillColor='#007c51'
                    radius={60000}
                />
                <Marker position={coordinates}>
                    <Popup>{popup}</Popup>
                </Marker>
            </Map>
        )
    }
    
}



