import logo from '../assets/logo.svg';

const Navigation = ({ account, setAccount }) => {
    // Add an account(wallet address) connection handler here rather than inside the App.js function
    const connectHandler = async () => {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        // Not exactly sure yet how the below setAccount's functionality is picked up by javascript/React? 
        // Does the React hook, useState, define it somewhere automatically? And is setAccount a standard React variable?
        setAccount(accounts[0]);
    }

    return (
        <nav>
            <ul className='nav__links'>
                <li><a href="#">Buy</a></li>
                <li><a href="#">Rent</a></li>
                <li><a href="#">Sell</a></li>
            </ul>

            <div className='nav__brand'>
                <img src={logo} alt="Logo" />
                <h1>Millow</h1>
            </div>

            {/* And now add the above account/address to the button */}
            {account ? (
                <button 
                    type="button" 
                    className='nav__connect'
                >
                    {account.slice(0, 6) + '...' + account.slice(38, 42)}
                </button>
            ) : (
                <button 
                    type="button" 
                    className='nav__connect' 
                    onClick={connectHandler}
                >
                    Connect
                </button>
            )}

        </nav>
    );

}

export default Navigation;
