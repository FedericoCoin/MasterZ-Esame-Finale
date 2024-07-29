const { expect } = require("chai");
const { ethers } = require("hardhat");

describe('Card Contract Tests', function () {
    let cardContract;
    let owner, addr1, addr2, addr3;

    const baseURI = "ipfs://QmVQG1RrJt7DUGKH9FtVHcTY8og2H8t7kywm36kH7dQc1c/";

    beforeEach(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Card = await ethers.getContractFactory('Card');
        cardContract = await Card.deploy();

        await cardContract.setURI(baseURI);
    });


    describe('Deployment', function () {
        it('Should set the correct base URI', async function () {
            expect(await cardContract.uri(1)).to.equal(baseURI + "1.json");
        });

        it('Set the owner correctly', async function () {
            expect(await cardContract.owner()).to.equal(owner.address);
        });

        it('Mint initial supply', async function () {
            // Check common creatures
            for (let i = 1; i <= 4; i++) {
                expect(await cardContract.balanceOf(owner.address, i)).to.equal(1000);
            }
            // Check rare creatures
            for (let i = 5; i <= 6; i++) {
                expect(await cardContract.balanceOf(owner.address, i)).to.equal(100);
            }
            // Check epic creatures
            for (let i = 7; i <= 8; i++) {
                expect(await cardContract.balanceOf(owner.address, i)).to.equal(10);
            }
            // Check legendary creatures
            for (let i = 9; i <= 10; i++) {
                expect(await cardContract.balanceOf(owner.address, i)).to.equal(1);
            }
            // Check packs
            expect(await cardContract.balanceOf(owner.address, 11)).to.equal(300);
            expect(await cardContract.balanceOf(owner.address, 12)).to.equal(30);
            expect(await cardContract.balanceOf(owner.address, 13)).to.equal(10);
            expect(await cardContract.balanceOf(owner.address, 14)).to.equal(2);
        });
    });

    describe('Creature Metadata', function () {
        it('Should get creature attributes correctly', async function () {
            const [type, rarity] = await cardContract.getCreatureAttributes(1);
            expect(type).to.equal("Skeleton");
            expect(rarity).to.equal("Common");
        });

        it('Revert when getting attributes for invalid creature ID', async function () {
            await expect(cardContract.getCreatureAttributes(0)).to.be.revertedWith('Invalid creature ID');
            await expect(cardContract.getCreatureAttributes(11)).to.be.revertedWith('Invalid creature ID');
        });
    });

    describe('Minting', function () {
        it('Should mint new tokens and update balances', async function () {
            await cardContract.connect(owner).mint(addr1.address, 1, 50, "0x");
            await cardContract.connect(owner).mint(addr1.address, 5, 25, "0x");
            await cardContract.connect(owner).mint(addr1.address, 7, 5, "0x");
            await cardContract.connect(owner).mint(addr1.address, 9, 1, "0x");

            expect(await cardContract.balanceOf(addr1.address, 1)).to.equal(50);
            expect(await cardContract.balanceOf(addr1.address, 5)).to.equal(25);
            expect(await cardContract.balanceOf(addr1.address, 7)).to.equal(5);
            expect(await cardContract.balanceOf(addr1.address, 9)).to.equal(1);
        

        it('Mint a batch of tokens and update balances', async function () {
            const ids = [1, 2, 3];
            const amounts = [5, 10, 15];
            await cardContract.connect(owner).mintBatch(addr1.address, ids, amounts, "0x");
            for (let i = 0; i < ids.length; i++) {
                expect(await cardContract.balanceOf(addr1.address, ids[i])).to.equal(amounts[i]);
            }
        });

        it('Revert if non-owner tries to mint', async function () {
            await expect(cardContract.connect(addr1).mint(addr1.address, 1, 1, "0x")).to.be.revertedWith('Ownable: caller is not the owner');
        });

        
        it('Emit TransferSingle event on mint', async function () {
            await expect(cardContract.connect(owner).mint(addr1.address, 1, 5, "0x"))
                .to.emit(cardContract, 'TransferSingle')
                .withArgs(owner.address, ethers.ZeroAddress, addr1.address, 1, 5);
        });

        it('Emit TransferBatch event on mintBatch', async function () {
            const ids = [1, 2, 3];
            const amounts = [5, 10, 15];
            await expect(cardContract.connect(owner).mintBatch(addr1.address, ids, amounts, "0x"))
                .to.emit(cardContract, 'TransferBatch')
                .withArgs(owner.address, ethers.ZeroAddress, addr1.address, ids, amounts);
        });
    });
    });

    describe('Token URI', function () {
        it('Should return the correct URI for a token', async function () {
            expect(await cardContract.uri(1)).to.equal(baseURI + "1.json");
        });

        it('Update base URI', async function () {
            const newBaseURI = "https://example.com/";
            await cardContract.connect(owner).setURI(newBaseURI);
            expect(await cardContract.uri(1)).to.equal(newBaseURI + "1.json");
        });

        it('Revert if non-owner tries to update base URI', async function () {
            await expect(cardContract.connect(addr1).setURI("https://example.com/")).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it('Set and return custom URI for a token', async function () {
            const customURI = "https://example.com/custom1.json";
            await cardContract.connect(owner).setTokenUri(1, customURI);
            expect(await cardContract.uri(1)).to.equal(customURI);
        });

        it('Revert when setting URI twice for a token', async function () {
            const customURI = "https://example.com/custom1.json";
            await cardContract.connect(owner).setTokenUri(1, customURI);
            await expect(cardContract.connect(owner).setTokenUri(1, customURI)).to.be.revertedWith("Cannot set uri twice");
        });
    });

    describe('Opening Packs', function () {
        beforeEach(async function () {
            await cardContract.connect(owner).mint(addr1.address, 11, 10, "0x");
            await cardContract.connect(owner).mint(addr1.address, 12, 10, "0x");
            await cardContract.connect(owner).mint(addr1.address, 13, 10, "0x");
            await cardContract.connect(owner).mint(addr1.address, 14, 10, "0x");
        });
    

        it('Revert if opening a pack not owned', async function () {
            await expect(cardContract.connect(addr2).openPack(11)).to.be.revertedWith("You don't own this pack");
        });

        it('Revert if opening an invalid pack ID', async function () {
            await expect(cardContract.connect(addr1).openPack(10)).to.be.revertedWith("Invalid pack ID");
            await expect(cardContract.connect(addr1).openPack(15)).to.be.revertedWith("Invalid pack ID");
        });

        it('Burn the pack after opening', async function () {
            await cardContract.connect(addr1).openPack(11);
            expect(await cardContract.balanceOf(addr1.address, 11)).to.equal(9);
        });

        it('Emit PackOpened event', async function () {
            return new Promise((resolve, reject) => {
                cardContract.on('PackOpened', (opener, packId, creatures, event) => {
                    expect(opener).to.equal(addr1.address);
                    expect(packId).to.equal(11);
                    expect(creatures.length).to.equal(3);
                    cardContract.removeAllListeners();
                    resolve();
                });
    
                cardContract.connect(addr1).openPack(11).catch((error) => {
                    cardContract.removeAllListeners();
                    reject(error);
                });
            });
        });
    
        it('Give correct number of cards when opening a pack', async function () {
            return new Promise((resolve, reject) => {
                cardContract.on('PackOpened', (opener, packId, creatures, event) => {
                    expect(creatures.length).to.equal(3);
                    cardContract.removeAllListeners();
                    resolve();
                });
    
                cardContract.connect(addr1).openPack(11).catch((error) => {
                    cardContract.removeAllListeners();
                    reject(error);
                });
            });
        });
    });

    describe('ERC1155 Supply', function () {
        it('Should track total supply correctly', async function () {
            const initialSupply = await cardContract.totalSupply(1);
            await cardContract.connect(owner).mint(addr1.address, 1, 10, "0x");
            expect(await cardContract.totalSupply(1)).to.equal(BigInt(initialSupply) + BigInt(10));

            await cardContract.connect(owner).mint(addr2.address, 1, 5, "0x");
            expect(await cardContract.totalSupply(1)).to.equal(BigInt(initialSupply) + BigInt(15));
        });
        it('Return correct exists status', async function () {
            expect(await cardContract.exists(1)).to.be.true; // Because of initial minting
            expect(await cardContract.exists(100)).to.be.false;
        });
    });

    describe('Pack Opening', function () {
        beforeEach(async function () {
            await cardContract.connect(owner).mint(addr1.address, 11, 5, "0x"); // Common Pack
            await cardContract.connect(owner).mint(addr1.address, 12, 5, "0x"); // Rare Pack
            await cardContract.connect(owner).mint(addr1.address, 13, 5, "0x"); // Epic Pack
            await cardContract.connect(owner).mint(addr1.address, 14, 5, "0x"); // Legendary Pack
        });
    
        const openPack = async (packId) => {
            const balancesBefore = await Promise.all(
                Array(10).fill().map((_, i) => cardContract.balanceOf(addr1.address, i + 1))
            );
            await cardContract.connect(addr1).openPack(packId);
            const balancesAfter = await Promise.all(
                Array(10).fill().map((_, i) => cardContract.balanceOf(addr1.address, i + 1))
            );
            return balancesAfter.map((after, i) => Number(after) - Number(balancesBefore[i]));
        };
    
        it('Open a Common Pack and return creatures', async function () {
            const creatures = await openPack(11);
            const receivedCreatures = creatures.filter(c => c > 0);
            console.log('Common Pack:', creatures);
            expect(receivedCreatures.length).to.be.greaterThan(0);
            expect(receivedCreatures.every((c, i) => i >= 0 && i <= 3)).to.be.true;
        });
    
        it('Open a Rare Pack and return creatures including at least one rare', async function () {
            const creatures = await openPack(12);
            const receivedCreatures = creatures.filter(c => c > 0);
            console.log('Rare Pack:', creatures);
            expect(receivedCreatures.length).to.be.greaterThan(0);
            expect(creatures.some((c, i) => c > 0 && i >= 4 && i <= 5)).to.be.true;
        });
    
        it('Open an Epic Pack and return creatures including at least one epic', async function () {
            const creatures = await openPack(13);
            const receivedCreatures = creatures.filter(c => c > 0);
            console.log('Epic Pack:', creatures);
            expect(receivedCreatures.length).to.be.greaterThan(0);
            expect(creatures.some((c, i) => c > 0 && i >= 6 && i <= 7)).to.be.true;
        });
    
        it('Open a Legendary Pack and return creatures including at least one epic or legendary', async function () {
            const creatures = await openPack(14);
            const receivedCreatures = creatures.filter(c => c > 0);
            console.log('Legendary Pack:', creatures);
            expect(receivedCreatures.length).to.be.greaterThan(0);
            expect(creatures.some((c, i) => c > 0 && i >= 6)).to.be.true;
        });
    
        it('Burn the pack after opening', async function () {
            const initialBalance = await cardContract.balanceOf(addr1.address, 11);
            await openPack(11);
            const finalBalance = await cardContract.balanceOf(addr1.address, 11);
            expect(Number(finalBalance)).to.equal(Number(initialBalance) - 1);
        });
    
        it("Revert when trying to open a pack the user doesn't own", async function () {
            await expect(cardContract.connect(addr2).openPack(11)).to.be.revertedWith("You don't own this pack");
        });
    });
    describe('Transfer', function () {
        beforeEach(async function () {
            await cardContract.connect(owner).safeTransferFrom(owner.address, addr1.address, 1, 10, "0x");
            await cardContract.connect(owner).safeTransferFrom(owner.address, addr1.address, 2, 20, "0x");
        });

        it('Transfer tokens between accounts', async function () {
            await cardContract.connect(addr1).safeTransferFrom(addr1.address, addr2.address, 1, 3, "0x");
            expect(await cardContract.balanceOf(addr1.address, 1)).to.equal(7);
            expect(await cardContract.balanceOf(addr2.address, 1)).to.equal(3);
        });

        it('Wmit TransferSingle event on transfer', async function () {
            await expect(cardContract.connect(addr1).safeTransferFrom(addr1.address, addr2.address, 1, 3, "0x"))
                .to.emit(cardContract, 'TransferSingle')
                .withArgs(addr1.address, addr1.address, addr2.address, 1, 3);
        });

        it('Should batch transfer tokens between accounts', async function () {
            await cardContract.connect(addr1).safeBatchTransferFrom(addr1.address, addr2.address, [1, 2], [3, 5], "0x");
            expect(await cardContract.balanceOf(addr1.address, 1)).to.equal(7);
            expect(await cardContract.balanceOf(addr1.address, 2)).to.equal(15);
            expect(await cardContract.balanceOf(addr2.address, 1)).to.equal(3);
            expect(await cardContract.balanceOf(addr2.address, 2)).to.equal(5);
        });

        it('Emit TransferBatch event on batch transfer', async function () {
            await expect(cardContract.connect(addr1).safeBatchTransferFrom(addr1.address, addr2.address, [1, 2], [3, 5], "0x"))
                .to.emit(cardContract, 'TransferBatch')
                .withArgs(addr1.address, addr1.address, addr2.address, [1, 2], [3, 5]);
        });
    });
});