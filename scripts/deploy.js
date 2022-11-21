// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");
const hre = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

async function main() {
  // Setup accounts > the contract(s) need these at deployment stage.
  // have access to ethers function/method because we're making use of hardhat.
  // this line retrieves the blockchain accounts that exist on this blockchain and assigns the first ones consequetively to the const in this list/array
  // variables not explicitly declared probably because its a list/array.
  [buyer, seller, inspector, lender] = await ethers.getSigners()

  // Deploy Real Estate
  const RealEstate = await ethers.getContractFactory('RealEstate')
  const realEstate = await RealEstate.deploy()
  // My understanding: only continue once the below is true. wait until below value turns true, then continue.
  await realEstate.deployed()

  // note the seemingly intentional use of special quotation marks here
  console.log(`Deployed Real Estate Contract at: ${realEstate.address}`)

  // Mint some NFTs to represent some Real Estate properties
  console.log(`Minting 3 properties...\n`)
  for (let i = 0; i < 3; i++) {
    const transaction = await realEstate.connect(seller).mint(`https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${i + 1}.json`)
    await transaction.wait()
  }

  // Deploy Escrow
  const Escrow = await ethers.getContractFactory('Escrow')
  const escrow = await Escrow.deploy(
    realEstate.address, 
    seller.address, 
    inspector.address, 
    lender.address
  )
  await escrow.deployed()

  console.log(`Deployed Escrow Contract at: ${escrow.address}`)

  // Approve the above 3 minted NFT-represented properties for listing in escrow contract
  for (let i = 0; i < 3; i++) {
    let transaction = await realEstate.connect(seller).approve(escrow.address, i + 1)
    await transaction.wait()    
  }

  // Send/List the above 3 minted NFT-represented properties to/in the escrow contract
  // This assumes buyer(s) already known and therefore added to the listing inside the smart contract
    let transaction = await escrow.connect(seller).list(1, buyer.address, tokens(20), tokens(10))
    await transaction.wait()
    transaction = await escrow.connect(seller).list(2, buyer.address, tokens(15), tokens(5))
    await transaction.wait()
    transaction = await escrow.connect(seller).list(3, buyer.address, tokens(10), tokens(5))
    await transaction.wait()

    console.log(`Finished.`)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
