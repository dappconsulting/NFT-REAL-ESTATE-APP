const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Escrow', () => {
    let buyer, seller, inspector, lender
    let realEstate, escrow

    beforeEach(async () => {

        // Setup accounts
        [buyer, seller, inspector, lender] = await ethers.getSigners()
  

        // Deploy Real Estate
        const RealEstate = await ethers.getContractFactory('RealEstate')
        realEstate = await RealEstate.deploy()

        // Mint
        var transaction = await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS")
        await transaction.wait()

        // Deploy Escrow contract
        const Escrow = await ethers.getContractFactory('Escrow')
        escrow = await Escrow.deploy(
            realEstate.address, 
            seller.address, 
            inspector.address, 
            lender.address
        )

        // Approve property/NFT listing, i.e. approve property/NFT ownership to be temp transferred to Escrow contract.
        var transaction = await realEstate.connect(seller).approve(escrow.address, 1)
        await transaction.wait()

        // List/send property/NFT to Escrow contract after above approval of same, by seller.
        var transaction = await escrow.connect(seller).list(1, buyer.address, tokens(10), tokens(5))
        await transaction.wait()

    } )

    describe('Deployment', () => {

        it('Returns NFT address', async () => {
            const result = await escrow.nftAddress()
            // chai assertion check:
            expect(result).to.be.equal(realEstate.address)

        })

        it('Returns Seller', async () => {
            const result = await escrow.seller()
            // chai assertion check:
            expect(result).to.be.equal(seller.address)
    
        })

        it('Returns inspector', async () => {
            const result = await escrow.inspector()
            // chai assertion check:
            expect(result).to.be.equal(inspector.address)
        })

        it('Returns lender', async () => {
            const result = await escrow.lender()
            // chai assertion check:
            expect(result).to.be.equal(lender.address)
        })

    })

    describe('Listing', () => {

        it('Transfers/updates ownership temporarily to Escrow contract', async () => {
            // chai assertion check:
            expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address)

        })

        it('Updates as listed', async () => {
            let result = await escrow.isListed(1)
            expect(result).to.be.equal(true)

        })

        it('Returns buyer', async () => {
            const result = await escrow.buyer(1)
            expect(result).to.be.equal(buyer.address)

        })

        it('Returns purchase price', async () => {
            let result = await escrow.purchasePrice(1)
            expect(result).to.be.equal(tokens(10))

        })

        it('Returns escrow amount', async () => {
            let result = await escrow.escrowAmount(1)
            expect(result).to.be.equal(tokens(5))

        })

    })

    describe('Deposits', () => {
        it('Updates escrow contract balance', async () => {
            var transaction = await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) })
            await transaction.wait()
            let result = await escrow.getBalance()
            expect(result).to.be.equal(tokens(5))


        })

    })

    describe('Inspection', () => {
        it('Updates property inspection status', async () => {
            var transaction = await escrow.connect(inspector).updateInspectionStatus(1, true)
            await transaction.wait()
            let result = await escrow.inspectionPassed(1)
            expect(result).to.be.equal(true)

        })

    })

    describe('Approval', () => {
        it('Updates property sale approval status to approved', async () => {
            let transaction = await escrow.connect(seller).approveSale(1)
            await transaction.wait()

            transaction = await escrow.connect(lender).approveSale(1)
            await transaction.wait()

            transaction = await escrow.connect(buyer).approveSale(1)
            await transaction.wait()

            expect(await escrow.approval(1, seller.address)).to.be.equal(true)
            expect(await escrow.approval(1, lender.address)).to.be.equal(true)
            expect(await escrow.approval(1, buyer.address)).to.be.equal(true)

        })

    })
    
    // not sure why there's an async in describe below?
    describe('Sale', async () => {
        beforeEach(async () => {
            let transaction = await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) })
            await transaction.wait()

            transaction = await escrow.connect(inspector).updateInspectionStatus(1, true)
            await transaction.wait()

            transaction = await escrow.connect(buyer).approveSale(1)
            await transaction.wait()
            transaction = await escrow.connect(seller).approveSale(1)
            await transaction.wait()
            transaction = await escrow.connect(lender).approveSale(1)
            await transaction.wait()

            // not sure why this one below doesnt have a transaction variable or the line below?
            await lender.sendTransaction({ to: escrow.address, value: tokens(5) })

            transaction = await escrow.connect(seller).finalizeSale(1)
            await transaction.wait()
        })

        it('Updates escrow balance after funds transfer to seller', async () => {
            expect(await escrow.getBalance()).to.be.equal(0)

        })

        it('Updates NFT ownership to new owner of NFT property(buyer)', async () => {
            expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address)

        })

    })

})
