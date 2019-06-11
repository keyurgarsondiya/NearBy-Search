import React, { Component } from 'react';
import axios from 'axios';
import Geocode from 'react-geocode';
import DisplayContent from './display_content';
import Autocomplete from 'react-google-autocomplete';
import 'bootstrap/dist/css/bootstrap.css';
import './main_screen.css';
const API_KEY = 'AIzaSyALb4eynR_OL39AuK731m6pB1toiTAP0Xg';

class MainScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lat: '',
      long: '',
      city: '',
      query: '',
      place_val: '',
      category_val: '',
      location_setted: '',
      prevToken: '',
      nextToken: '',
      loading: true,
      page: 1,
      dist: [],
      result: [],
      result1: [],
      result2: [],
      result3: [],
      buttons: [],
      types: [],
      main_result: [],
      search_clicked: false,
      sort_asc: false,
      sort_desc: false,
      sort_rel: true
    };
  }

  calculateDistance = async () => {
    var destinations = [];
    // if(this.state.result)
    this.state.result.map(item => {
      let temp = item.geometry.location.lat + ',' + item.geometry.location.lng;

      destinations = [temp, ...destinations];
    });
    destinations = destinations.join('|');
    destinations = encodeURIComponent(destinations);
    console.log('Destinations : ', destinations);
    var ori = this.state.lat + ',' + this.state.long;
    console.log('Origin : ', ori);
    var res2 = await axios.get(
      `/getdistance?origin=${ori}&dest=${destinations}`
    );
    console.log('Response 2 : ', res2);
    var distance = [];
    if (res2 && res2.data && res2.data.rows && res2.data.rows.length !== 0) {
      res2.data.rows[0].elements.map(item => {
        distance = [item.distance.text, ...distance];
        // console.log('Distance : ', item.ditance)
      });
      this.setState({ dist: distance });
      this.state.result.forEach((element, i) => {
        element.dist = distance[i];
      });
      // console.log('Distance : ', distance);
      console.log('Result at end of Calculate Distance : ', this.state.result);
    }
  };

  getPosition = options => {
    return new Promise(function(resolve, reject) {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  };

  findLocation = () => {
    const check = window.navigator && window.navigator.geolocation;
    if (check) {
      this.getPosition()
        .then(position => {
          this.setState({
            lat: position.coords.latitude,
            long: position.coords.longitude
          });
          console.log(position);
        })
        .catch(err => {
          alert(
            'You have denied to provide access to your location, you can grant access from site settings '
          );
        });
    } else {
      console.log('Sorry your browser does not support Geolocation ');
    }
  };

  componentDidMount() {
    this.findLocation();
  }

  handleSetCurrentLocationClick = async () => {
    console.log(`Latitude : ${this.state.lat}, Longitude : ${this.state.long}`);
    Geocode.setApiKey(`${API_KEY}`);
    Geocode.fromLatLng(this.state.lat, this.state.long).then(
      response => {
        const address = response.results[0].formatted_address;
        this.setState({
          place_val: address,
          location_setted: address,
          main_result: [],
          result: [],
          result1: [],
          result2: [],
          result3: [],
          page: 1
        });
        console.log(address);
      },
      error => {
        console.error(error);
      }
    );
  };

  handleSetLocationClick = async () => {
    const place = this.state.place_val;
    if (place !== '') {
      this.setState({ location_setted: place });
    } else {
      this.handleSetCurrentLocationClick();
    }
    this.setState({
      main_result: [],
      result: [],
      result1: [],
      result2: [],
      result3: [],
      page: 1
    });
    console.log(
      'handleSetLocationClick Location Setted : ',
      this.state.location_setted
    );
  };

  handleCategoryClick = async () => {
    // e.preventDefault();
    if (this.state.place_val.length === 0) {
      this.handleSetCurrentLocationClick();
    }
    console.log('Location Setted : ', this.state.location_setted);
    if (this.state.place_val !== this.state.location_setted) {
      this.handleSetLocationClick();
    }
    var place = this.state.location_setted;
    place = encodeURIComponent(place);
    var res1 = await axios.get(`/getlocation?search=${place}`);
    console.log('Response 1 : ', res1);
    if (
      res1 &&
      res1.data &&
      res1.data.candidates[0] &&
      res1.data.candidates[0].geometry &&
      res1.data.candidates[0].geometry.location
    ) {
      this.setState({
        lat: res1.data.candidates[0].geometry.location.lat,
        long: res1.data.candidates[0].geometry.location.lng
      });
    }

    const category = this.state.category_val;
    console.log('Cateogory being Searched : ', category);
    if (category !== '') {
      console.log(
        'Lat and Long on Category Click : ',
        this.state.lat,
        this.state.long,
        category
      );
      let res2 = await axios.get(
        `/placesearch?lat=${this.state.lat}&long=${
          this.state.long
        }&cat=${category}`
      );
      console.log('Category Click Response 2 : ', res2);
      this.setState({
        main_result: res2.data.results,
        result: res2.data.results,
        result1: res2.data.results,
        nextToken: res2.data.next_page_token,
        types: [],
        buttons: []
      });
    } else {
      console.log(
        'Lat and Long on Category Click : ',
        this.state.lat,
        this.state.long
      );

      let res2 = await axios.get(
        `/search?lat=${this.state.lat}&long=${this.state.long}`
      );
      console.log('Category Click Response 2 with NULL category : ', res2);
      this.setState({
        main_result: res2.data.results,
        result: res2.data.results,
        result1: res2.data.results,
        nextToken: res2.data.next_page_token
      });
    }
    this.calculateDistance();
    this.setState({ search_clicked: true });
    this.buttonTypes();
  };

  buttonTypes = () => {
    var displayButtons;
    if (this.state.search_clicked === true) {
      this.state.main_result.map(item => {
        if (item && item.types && item.types.length !== 0) {
          item.types.map(type => {
            if (this.state.types.includes(type) === false) {
              this.setState({ types: [type, ...this.state.types] });
            }
          });
        }
      });
      console.log('Types of Buttons : ', this.state.types);
      displayButtons = this.state.types.map((type, i) => {
        return (
          <p
            className='w3-bar-item w3-button'
            key={i}
            onClick={() => this.handleButtonClick(type)}
          >
            {type}
          </p>
        );
      });
      this.setState({ buttons: displayButtons });
    }
  };

  handlePrevClick = () => {
    console.log('Prev Click');
    // let page = this.state.page;
    if (this.state.page > 1) {
      if (this.state.page === 2) {
        this.setState({
          result: this.state.result1,
          main_result: this.state.result1
        });
      } else if (this.state.page === 3) {
        this.setState({
          result: this.state.result2,
          main_result: this.state.result2
        });
      }
      const newPage = this.state.page - 1;
      this.setState({ page: newPage });
      this.buttonTypes();
    } else if (this.state.page === 1) {
      this.setState({
        result: this.state.result1,
        main_result: this.state.result1
      });
    }
    // this.calculateDistance();
    console.log('Page : ', this.state.page);
    console.log('Result : ', this.state.result);
  };

  handleNextClick = async () => {
    console.log('Next Click');
    console.log('Next Token Value : ', this.state.nextToken);
    // let page = this.state.page;
    console.log('In beginning Page value : ', this.state.page);
    if (this.state.page < 3) {
      if (this.state.page === 1) {
        if (this.state.result2 && this.state.result2.length === 0) {
          console.log('Entered where Result 2 Length is Zero');
          // var url = `/getnextpage?lat=${this.state.lat}&long=${
          //     this.state.long
          //   }&nextToken=${this.state.nextToken}`;
          //   url = encodeURIComponent(url);
          var res = await axios.get(
            `/getnextpage?lat=${this.state.lat}&long=${
              this.state.long
            }&nextToken=${this.state.nextToken}`
          );
          console.log('Response obtained for Next Page : ', res);
          this.setState({
            result: res.data.results,
            main_result: res.data.results,
            result2: res.data.results,
            nextToken: res.data.next_page_token
          });
          if (this.state.result.length !== 0) {
            this.calculateDistance();
          }
        } else {
          this.setState({
            result: this.state.result2,
            main_result: this.state.result2
          });
        }
      } else if (this.state.page === 2) {
        if (this.state.result3 && this.state.result3.length === 0) {
          res = await axios.get(
            `/getnextpage?lat=${this.state.lat}&long=${
              this.state.long
            }&nextToken=${this.state.nextToken}`
          );
          this.setState({
            result: res.data.results,
            main_result: res.data.results,
            result3: res.data.results,
            nextToken: res.data.next_page_token
          });
          if (this.state.result.length !== 0) {
            this.calculateDistance();
          }
        } else {
          this.setState({
            result: this.state.result3,
            main_result: this.state.result3
          });
        }
      }
      this.setState({ page: this.state.page + 1 });
      this.buttonTypes();
    } else if (this.state.page === 3) {
      this.setState({
        result: this.state.result3,
        main_result: this.state.result3
      });
    }
    // this.calculateDistance();
    console.log('At Last Page value : ', this.state.page);
    console.log('Result After Next Click : ', this.state.result);
  };

  handleButtonClick = name => {
    console.log('Clicked Button : ', name);
    var res = [];
    this.setState({ result: [] });
    console.log('Main Result Before Clear Array : ', this.state.main_result);
    console.log('Length of result : ', this.state.result.length);
    console.log('Main Result : ', this.state.main_result);
    this.state.main_result.map(item => {
      if (item.types.includes(name) === true) {
        res = [item, ...res];
        console.log('Item Types : ', item.types);
      }
    });
    console.log('The Response After Button Click : ', res);
    // this.setState({ result: res }, () => {console.log('Result after Button Click : ', this.state.result)});
    // console.log('Result after Button Click : ', this.state.result);
    // console.log('Result after Button Click : ', this.state.result);
    setStateSynchronous(res)
      .then(res => setStateSynchronous(res))
      .then(response => {
        this.setState({ result: response });
        console.log('Result after Button Click : ', this.state.result);
        if (this.state.sort_asc === true) {
          this.handleAscClick();
        } else if (this.state.sort_desc === true) {
          this.handleDescClick();
        }
        return true;
      });

    console.log('Result after the sort checked : ', this.state.result);
  };

  handleRelavance = () => {
    this.setState({ sort_asc: false, sort_desc: false, sort_rel: true });
    this.setState({ result: this.state.main_result });
  };

  handleAscClick = () => {
    this.setState({ sort_asc: true, sort_desc: false, sort_rel: false });
    this.state.result.sort((a, b) => {
      let a_dist = a.dist.split(' ');
      let b_dist = b.dist.split(' ');
      let a_temp = parseFloat(a_dist[0]),
        b_temp = parseFloat(b_dist[0]);
      if (a_dist[1] === 'km') {
        a_temp = parseFloat(a_dist[0]);
        a_temp = a_temp * 1000;
      }
      if (b_dist[1] === 'km') {
        b_temp = parseFloat(b_dist[0]);
        b_temp = b_temp * 1000;
      }
      return a_temp > b_temp ? 1 : -1;
    });

    console.log('After Sort Result : ', this.state.result);
    this.setState({ result: this.state.result });
  };

  handleDescClick = () => {
    this.setState({ sort_asc: false, sort_desc: true, sort_rel: false });
    this.state.result.sort((a, b) => {
      let a_dist = a.dist.split(' ');
      let b_dist = b.dist.split(' ');
      let a_temp = parseFloat(a_dist[0]),
        b_temp = parseFloat(b_dist[0]);
      if (a_dist[1] === 'km') {
        a_temp = parseFloat(a_dist[0]);
        a_temp = a_temp * 1000;
      }
      if (b_dist[1] === 'km') {
        b_temp = parseFloat(b_dist[0]);
        b_temp = b_temp * 1000;
      }
      return a_temp < b_temp ? 1 : -1;
    });

    console.log('After Sort Result : ', this.state.result);
    this.setState({ result: this.state.result });
  };

  handleChange = e => {
    this.setState({ [e.target.name]: e.target.value });
  };

  handleSelect = place => {
    if(place && place.formatted_address)
    {
      this.setState({place_val: place.formatted_address});
    }
  }

  render() {
    return (
      <div>
        {/* <input
          type='text'
          className='form-control'
          placeholder='Enter the place you looking for?'
          name='place_val'
          onChange={this.handleChange}
          value={this.state.place_val}
          style={{ marginTop: '1rem' }}
        /> */}
        <Autocomplete
          className='form-control'
          style={{ width: '100%', marginTop: '1rem' }}
          onPlaceSelected={place => {
            console.log(place);
            this.handleSelect(place)
          }}
          types={['(regions)']}
        />
        <div
          className='submitButton'
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '3rem',
            marginBottom: '3rem'
          }}
        >
          <button
            type='button'
            className='btn btn-primary'
            style={{ marginRight: '2rem' }}
            onClick={this.handleSetCurrentLocationClick}
          >
            Set Current Location
          </button>
          <button
            type='button'
            className='btn btn-primary'
            onClick={this.handleSetLocationClick}
            style={{ marginLeft: '2rem' }}
          >
            Set Location
          </button>
        </div>
        <div>
          <input
            className='form-control'
            name='category_val'
            type='text'
            onChange={this.handleChange}
            value={this.state.category_val}
            placeholder='Enter the category you want to search'
            style={{ marginBottom: '1rem' }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '3rem',
              marginBottom: '3rem'
            }}
          >
            <button
              className='btn btn-primary'
              type='button'
              onClick={this.handleCategoryClick}
            >
              Category Search
            </button>
          </div>
        </div>
        {this.state.search_clicked ? (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '3rem'
              }}
            >
              <span style={{ marginRight: '2rem' }}>
                <button
                  type='button'
                  className='btn btn-primary'
                  onClick={this.handlePrevClick}
                >
                  Prev
                </button>
              </span>
              <span style={{ marginLeft: '2rem' }}>
                <button
                  type='button'
                  className='btn btn-primary'
                  onClick={this.handleNextClick}
                >
                  Next
                </button>
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div className='w3-container' style={{ marginRight: '2rem' }}>
                <div className='w3-dropdown-hover'>
                  <button className='w3-button w3-black'>Sort By</button>
                  <div className='w3-dropdown-content w3-bar-block w3-border'>
                    <p
                      className='w3-bar-item w3-button'
                      onClick={this.handleRelavance}
                    >
                      Sort By Relevance
                    </p>
                    <p
                      className='w3-bar-item w3-button'
                      onClick={this.handleAscClick}
                    >
                      Sort in Ascending Order
                    </p>
                    <p
                      className='w3-bar-item w3-button'
                      onClick={this.handleDescClick}
                    >
                      Sort in Descending Order
                    </p>
                  </div>
                </div>
              </div>
              <div className='w3-container' style={{ marginLeft: '2rem' }}>
                <div className='w3-dropdown-hover'>
                  <button className='w3-button w3-black'>Categories</button>
                  <div className='w3-dropdown-content w3-bar-block w3-border'>
                    {this.state.buttons}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div />
        )}
      <DisplayContent SearchList={this.state.result} />
      </div>
    );
  }
}

function setStateSynchronous(res) {
  return new Promise(resolve => {
    resolve(res);
  });
}

export default MainScreen;
