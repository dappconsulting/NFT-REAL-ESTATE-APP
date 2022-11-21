import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

import close from '../assets/close.svg';

const Home = ({ home, provider, account, escrow, togglePop }) => {

    const [hasBought, setHasBought] = useState(false)
    const [hasLended, setHasLended] = useState(false)
    const [hasInspected, setHasInspected] = useState(false)
    const [hasSold, setHasSold] = useState(false)

    const [buyer, setBuyer] = useState(null)
    const [lender, setLender] = useState(null)
    const [inspector, setInspector] = useState(null)
    const [seller, setSeller] = useState(null)

    const [owner, setOwner] = useState(null)

    const fetchDetails = async () => {

        // Buyer
        const buyer = await escrow.buyer(home.id)
        setBuyer(buyer)

        const hasBought = await escrow.approval(home.id, buyer)
        setHasBought(hasBought)

        // Seller
        const seller = await escrow.seller()
        setSeller(seller)

        const hasSold = await escrow.approval(home.id, seller)
        setHasSold(hasSold)

        // Lender
        const lender = await escrow.lender()
        setLender(lender)

        const hasLended = await escrow.approval(home.id, lender)
        setHasLended(hasLended)

        // Inspector
        const inspector = await escrow.inspector()
        setInspector(inspector)
        
        const hasInspected = await escrow.inspectionPassed(home.id)
        setHasInspected(hasInspected)

    }

    // I guess once the escrow contract deal is approved by all parties THEN only the below function is accessible?...
    const fetchOwner = async () => {
        if (await escrow.isListed(home.id)) return

        const owner = await escrow.buyer(home.id)
        setOwner(owner)
    }

    // Now we want to do useEffect on the above 2 functions
    // Whenever the [hasSold] value changes, it will trigger a recall/refetch of the functions inside of useEffect function.
    useEffect(() => {
        fetchDetails()
        fetchOwner()
    }, [hasSold]) // whenever this value changes, it triggers a refetch/recall of the stuff inside the useEffect function.

    // this function is called when the buyer clicks on the Buy button
    const buyHandler = async () => {       
        // doesnt need the ethers.js provider because it doesnt use the user wallet address to do the tx below
        const escrowAmount = await escrow.escrowAmount(home.id)
        // needs to use the ethers.js provider function here because its talking to/using/accessing the user's wallet address
        // i.e. the potential buyer's wallet address
        // apparently the getSigner() function retrieves the FIRST account in the user's metamask? Is this true?
        const signer = await provider.getSigner()

        // Buyer deposits the required earnest/escrow amount into the Escrow smart contract
        // not sure why "let" is used here instead of "const"? maybe it's because with "const" declaration you cannot use same variable again inside block?
        let transaction = await escrow.connect(signer).depositEarnest(home.id, { value: escrowAmount })
        await transaction.wait()

        // Buyer approves...
        transaction = await escrow.connect(signer).approveSale(home.id)
        await transaction.wait()

        // Disable the "Buy" button for this property (because it was just bought, at least from buyer's side)
        // sets hasBought = true
        setHasBought(true)
    }

    // this function is called when the inspector clicks on their button, to approve
    const inspectHandler = async () => {      
        const signer = await provider.getSigner()

        // Inspector updates status(approves by clicking on the approve button)
        const transaction = await escrow.connect(signer).updateInspectionStatus(home.id, true)
        await transaction.wait()

        setHasInspected(true)
    }

    // this function is called when the lender clicks on their button, to approve
    const lendHandler = async () => {      
        const signer = await provider.getSigner()
        
        // Lender approves the sale/purchase first, especially after buyer has deposited the escrow amount...
        const transaction = await escrow.connect(signer).approveSale(home.id)
        await transaction.wait()

        // Lender sends funds to escrow contract...
        const lendAmount = (await escrow.purchasePrice(home.id) - await escrow.escrowAmount(home.id))
        // not sure why the below tx is used versus the tx used for the buyer one? In terms of solidity functions? What am I missing here?
        await signer.sendTransaction({ to: escrow.address, value: lendAmount.toString(), gasLimit: 60000 })

        setHasLended(true)
    }

    // this function is called when the seller clicks on their button, to approve
    const sellHandler = async () => {      
        const signer = await provider.getSigner()

        // Seller approves > to separate the sale approval and the transfer of the assets into 2 separate transactions
        let transaction = await escrow.connect(signer).approveSale(home.id)
        await transaction.wait()

        // Seller finalizes sale > transfer of assets to conclude the sale/purchase of the property
        transaction = await escrow.connect(signer).finalizeSale(home.id)
        await transaction.wait()

        setHasSold(true)
    }

    return (
        <div className="home">
            <div className="home__details">
                <div className="home_image">
                    <img src={home.image} alt="Home"/>
                </div>

                <div className="home__overview">
                    <h1>{home.name}</h1>
                    <p>
                        <strong>{home.attributes[2].value}</strong> bds |
                        <strong>{home.attributes[3].value}</strong> ba |
                        <strong>{home.attributes[4].value}</strong> sqft   
                    </p>
                    <p>{home.address}</p>
                    <h4>{home.attributes[0].value} ETH</h4>

                    {/* conditional: if (new) owner exists, then show portion of account address. Otherwise, display contextual button depending on who connects wallet.. */}
                    {owner ? (
                        <div className='home__owned'>
                            Owned by {owner.slice(0,6) + '...' + owner.slice(38,42)}
                        </div>
                    ) : (
                        <div>
                            {(account === inspector) ? (
                                <button className="home__buy" onClick={inspectHandler} disabled={hasInspected}>
                                    Approve Inspection
                                </button>
                            ) : (account === lender) ? (
                                <button className="home__buy" onClick={lendHandler} disabled={hasLended}>
                                    Approve & Lend
                                </button>
                            ) : (account === seller) ? (
                                <button className="home__buy" onClick={sellHandler} disabled={hasSold}>
                                    Approve & Sell
                                </button>
                            ) : (
                                <button className="home__buy" onClick={buyHandler} disabled={hasBought}>
                                    Buy
                                </button>
                            )}

                            <button className='home__contact'>
                                Contact agent
                            </button>

                        </div>                        
                    )}

                    <hr />

                    <h2>Overview</h2>

                    <p>
                        {home.description}
                    </p>

                    <hr />

                    <h2>Facts and features</h2>

                    <ul>
                        {home.attributes.map((attribute, index) => (
                            <li key={index}><strong>{attribute.trait_type}</strong> : {attribute.value}</li>
                        ))}                    
                    </ul>

                </div>

                <button onClick={togglePop} className="home__close">
                    <img src={close} alt="Close"/>
                </button>

            </div>
        </div>
    );
}

export default Home;
