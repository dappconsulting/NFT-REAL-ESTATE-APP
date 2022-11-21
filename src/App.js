// react hooks
import { useEffect, useState } from 'react';
// ethers.js library from HardHat used to connect/bridge frontend to blockchain backend
import { ethers } from 'ethers';

// Components
import Navigation from './components/Navigation';
import Search from './components/Search';
import Home from './components/Home';

// ABIs
import RealEstate from './abis/RealEstate.json';
import Escrow from './abis/Escrow.json';

// Config
import config from './config.json';

function App() {  

  // Below line mostly for being able to now access the smart contract stuff for the frontend functionality
  const [provider, setProvider] = useState(null)

  const [escrow, setEscrow] = useState(null)

  // using React hook, useState function, and assigning below variables to it
  // so that we can set the account state for the component (loadBlockchainData?), and read the state too.
  // one of the other reasons for storing the account here in app level is for when the user changes accounts after initial connection.
  const [account, setAccount] = useState(null)

  // Plural
  const [homes, setHomes] = useState([])
  // Singular, and notice the curly brackets instead of square brackets, or null
  const [home, setHome] = useState({})
  const [toggle, setToggle] = useState(false)

  // defining/loading this function, not calling it yet. Will call it via a react hook
  const loadBlockchainData = async () => {

    // create connection/bridge between frontend & blockchain via an ethers.js' provider, also via React hook
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)

    // relevant ethereum network connected to in order to access the relevant smart contracts
    const network = await provider.getNetwork()

    // Using config.json to pull the correct smart contract (info) using network variable above
    // and then creating an instance of the "path"/connection between frontend and backend(smart contract)
    // in effect this is the frontend/javascript const/variable instance for the RealEstate smart contract.
    const realEstate = new ethers.Contract(config[network.chainId].realEstate.address, RealEstate, provider)
    const totalSupply = await realEstate.totalSupply()
    // now want to store/list the (3) properties in an array
    const homes = []
    // not sure why its done this way? Whats URI anyway, and why the extra 1-2 steps below?
    for (var i = 1; i <= totalSupply; i++) {
      const uri = await realEstate.tokenURI(i)
      const response = await fetch(uri)
      const metadata = await response.json()
      homes.push(metadata)       
    }
    // and then set a React hook for this too.
    setHomes(homes)

    // also creating a frontend/javascript instance of the Escrow smart contract
    const escrow = new ethers.Contract(config[network.chainId].escrow.address, Escrow, provider)
    // and note that we created a React hook for this one too
    setEscrow(escrow)

    // to retrieve(and select if necessary) your currently active metamask account/wallet address.
    // any other use/reason for below transaction?
    // and we want to now save this account(s) (selected) below with the (loadBlockchainData?) component state
    // ok, React uses components to (re)-ORGANISE and (re)-USE our code...
    // but components also have a state: it's like a little "database"/list inside the component state. to record component subvalues?
    // Using the React component state hook, useState, we can access those values inside each component's state...
    // And now extra functionality was added to handle when user changes accounts after initial connection, for example?
    window.ethereum.on('accountsChanged', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts'});
      const account = ethers.utils.getAddress(accounts[0])
      setAccount(account);
    })

  }

  // calling the above function via the below react hook
  useEffect(() => {
    loadBlockchainData()
  }, []) // this empty array for detecting/listing any changes?

  // and using a React hook here too, as well as the toggle hook declared above
  const togglePop = (home) => {
    setHome(home)
    {/* if toggle (not sure/undefined?) then false, otherwise true?? */}
    toggle ? setToggle(false) : setToggle(true)
  }

  return (
    <div>

      {/* The below is the const pulled from the Navigation.js component */}
      {/* and this is how you do a comment in React.js inside html */}
      {/* and then we're also inputting here the two parameters of this function below */}
      <Navigation account={account} setAccount={setAccount} />
      <Search />

      <div className='cards__section'>

        <h3>Homes For You</h3>

        <hr />

        <div className='cards'>
          {/* Ok, the ( after the => below was changed from { to (, because its an implicit value returned? Weird. Check this.  */}
          {homes.map((home, index) => (
            <div className='card' key={index} onClick={() => togglePop(home)}> {/* This toggleProp function DEF needs a parameter/argument "home", otherwise it doesnt work */}
              <div className='card__image'>
                {/* home here represents one of the homes list values/entries, and .image comes from its metadata file(.json) */}
                <img src={home.image} alt="Home" />
              </div>
              <div className='card__info'>
                <h4>{home.attributes[0].value} ETH</h4>
                <p>
                  <strong>{home.attributes[2].value}</strong> bds |
                  <strong>{home.attributes[3].value}</strong> ba |
                  <strong>{home.attributes[4].value}</strong> sqft             
                </p>
                <p>{home.address}</p>
              </div>
            </div>

          ))}
        </div>

      </div>
      {/* using the toggle hook here, inside the main div, to be activated at onClick event? */}
      {/* the .js file used to render the property/home that was selected, onto the screen, the buy/sell details I assume */}
      {toggle && (
        <Home home={home} provider={provider} account={account} escrow={escrow} togglePop={togglePop} />
      )}
    </div>
  );
}

export default App;
