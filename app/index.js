import React, { Component } from 'react';
import {
  Slider,
  Image,
  AppRegistry,
  Text,
  View,
} from 'react-native';

// To be addressed after fixing react-native-svg package
// https://github.com/steveliles/react-native-circular-slider-example
// import CircularSlider from './CircularSlider';

import { weatherIcon, windIcon } from "./icons";
import moment from 'moment';

import { styles } from "./styles";



export default class LizardWeatherApp extends Component {


  constructor(props, context) {
    super(props, context);

    // Big issue here to be fixed!
    // if user's phone time is not synced with his location
    // then we need to read the day and hour
    // from API response instead of device
    // for the sake of test, we use device time for now

    this.state = {
      forecast: null,
      location: 'unknown',
      temperature: '..',
      weatherIcon: weatherIcon(),
      startOfDay: moment().startOf('day').unix(),
      startOfHour: moment().startOf('hour').unix(),
      windBearing: '0deg',
      // slider: 270,
    }
  }

  componentWillMount() {
  }

  componentDidMount() {
    this.setState({
      date: moment().format('dddd, MMMM Do')
    });

    this.fetchWeather();
  }

  
  fetchLocation() {
    return new Promise(function(resolve) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = position.coords.latitude + ',' + position.coords.longitude;

          resolve(location);
        },
        // (error) => this.setState({ location: 37.30 + ', ' + 49.59}),
        (error) => console.log(error.message),
        {enableHighAccuracy: false, timeout: 5000, maximumAge: 1000}
      );
    });
  }


  async fetchWeather() {
    let location = await this.fetchLocation(); 

    // Fetching hourly forecast from forecast.io, because Yahoo Weather API doesn't provide hourly forecasts
    fetch('https://api.forecast.io/forecast/8cf051db1c0b0c0ed2a2a06b29e0c8aa/' + location + ',' + this.state.startOfDay + '?exclude=[minutely,daily]')
      .then((response) => response.json())
      .then((responseJson) => {
        this.setState( { temperature: '...' } );
        this.setState( { forecast: responseJson.hourly.data });

        const currentHourData = this.getCurrentHourData();

        this.setState( { temperature: Math.round( currentHourData.temperature ) + '° F' } );
        this.setState( { weatherIcon: weatherIcon( currentHourData.icon ) } );

      });


    // Fetching the city name from yahoo API, because forecast.io guys couldn't provide it due to licensing, they're working on it tho
    // Maybe I should've spent a bit of time for an API that provides both :p
    
    fetch('https://query.yahooapis.com/v1/public/yql?q=select%20location%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text="(' + location + ')")&format=json')
      .then((response) => response.json())
      .then((responseJson) => {
        console.log('city name', responseJson.city);
        this.setState( { location: responseJson.query.results.channel.location.city } );
      })
      .catch((error) => {
        this.setState( { location: 'Err!' } );
      });
  }

  getCurrentHourData(forHour) {
    if (forHour) {
      forHour = moment({hour: forHour}).unix();
    } else {
      forHour = this.state.startOfHour;
    }

    const times = this.state.forecast.map( d => d.time );
    const currentHourIndex = times.indexOf(forHour);

    return this.state.forecast[currentHourIndex];
  }


  updateAllValues(value) {
    const currentHourData = this.getCurrentHourData(value);

    this.setState({
      temperature: Math.round( currentHourData.temperature ) + '° F',
      weatherIcon: weatherIcon( currentHourData.icon ),
      windBearing: currentHourData.windBearing + 'deg',
    });
  }


  render() {
    return (
      <Image source={require('./bg.jpg')} style={styles.container}>
        <Text style={styles.date}>
          {this.state.date}
        </Text>

        <Text style={styles.weatherIcon}>
          {this.state.weatherIcon}
        </Text>

        <Text style={styles.temperature}>
          {this.state.temperature}
        </Text>

        {/*<View style={styles.slider}>
          <CircularSlider width={200} height={200} meterColor='#0cd' textColor='#fff'
            value={this.state.slider} onValueChange={(value)=>this.setState({slider:value})}/>
        </View>*/}

        <SliderExample
          {...this.props}
          onSlidingComplete={(value) => { this.updateAllValues(value) }}
          onValueChange={ (value) => this.updateAllValues(value) } />

        <Text style={[styles.windBearing, { transform: [{rotate: this.state.windBearing.toString()}] }]}>
          { windIcon() }
        </Text>

        <Text style={styles.location}>
          {this.state.location}
        </Text>
      </Image>
    );
  }

}




class SliderExample extends Component {
  static defaultProps = {
    value: moment().startOf('hour').hour(),
    minimumValue: 0,
    maximumValue: 23,
    step: 1,
  };

  state = {
    value: this.props.value,
  };

  render() {
    return (
      <View>
        <Text style={styles.sliderValue} >
          {this.state.value && +this.state.value.toFixed(3)}:00
        </Text>
        <Slider
          {...this.props}
          onValueChange={(value) => this.setState({value: value})} />
      </View>
    );
  }
}
