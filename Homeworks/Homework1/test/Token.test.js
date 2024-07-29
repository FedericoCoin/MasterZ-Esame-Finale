const Token = artifacts.require("Token");

contract("Token", accounts => {
    let token;
    const [owner, user1, user2, user3, nonOwner] = accounts;

    beforeEach(async () => {
        token = await Token.new("TestToken", "TTK");
    });

    it("Add an address to the blacklist by the owner", async () => {
        await token.addBlackList(user1, { from: owner });
        const isBlackListed = await token.isBlackListed(user1);
        assert.isTrue(isBlackListed, "User1 should be blacklisted");
    });

    it("Emit a Blacklisted event when adding to blacklist", async () => {
        const receipt = await token.addBlackList(user1, { from: owner });
        assert.equal(receipt.logs.length, 1, "should have received one event");
        assert.equal(receipt.logs[0].event, "Blacklisted", "event name should be Blacklisted");
        assert.equal(receipt.logs[0].args.account, user1, "should be the blacklisted user1");
    });

    it("Remove an address from the blacklist by the owner", async () => {
        await token.addBlackList(user1, { from: owner });
        await token.removeBlackList(user1, { from: owner });
        const isBlackListed = await token.isBlackListed(user1);
        assert.isFalse(isBlackListed, "User1 should be removed from the blacklist");
    });

    it("Emit a Whitelisted event when removing from blacklist", async () => {
        await token.addBlackList(user1, { from: owner });
        const receipt = await token.removeBlackList(user1, { from: owner });
        assert.equal(receipt.logs.length, 1, "should have received one event");
        assert.equal(receipt.logs[0].event, "Whitelisted", "event name should be Whitelisted");
        assert.equal(receipt.logs[0].args.account, user1, "should be the whitelisted user1");
    });

    it("Should not affect other addresses when blacklisting one address", async () => {
        await token.addBlackList(user1, { from: owner });
        const isUser1BlackListed = await token.isBlackListed(user1);
        const isUser2BlackListed = await token.isBlackListed(user2);
        assert.isTrue(isUser1BlackListed, "User1 should be blacklisted");
        assert.isFalse(isUser2BlackListed, "User2 should not be blacklisted");
    });

    it("Should handle multiple addresses being blacklisted and whitelisted", async () => {
        await token.addBlackList(user1, { from: owner });
        await token.addBlackList(user2, { from: owner });
        await token.addBlackList(user3, { from: owner });

        let isUser1BlackListed = await token.isBlackListed(user1);
        let isUser2BlackListed = await token.isBlackListed(user2);
        let isUser3BlackListed = await token.isBlackListed(user3);

        assert.isTrue(isUser1BlackListed, "User1 should be blacklisted");
        assert.isTrue(isUser2BlackListed, "User2 should be blacklisted");
        assert.isTrue(isUser3BlackListed, "User3 should be blacklisted");

        await token.removeBlackList(user2, { from: owner });

        isUser1BlackListed = await token.isBlackListed(user1);
        isUser2BlackListed = await token.isBlackListed(user2);
        isUser3BlackListed = await token.isBlackListed(user3);

        assert.isTrue(isUser1BlackListed, "User1 should still be blacklisted");
        assert.isFalse(isUser2BlackListed, "User2 should be whitelisted");
        assert.isTrue(isUser3BlackListed, "User3 should still be blacklisted");
    });

    it("Should not add an already blacklisted address", async () => {
        await token.addBlackList(user1, { from: owner });
        const receipt = await token.addBlackList(user1, { from: owner });

        const isBlackListed = await token.isBlackListed(user1);
        assert.isTrue(isBlackListed, "User1 should be blacklisted");

        // Check if no additional Blacklisted event was emitted
        assert.equal(receipt.logs.length, 0, "should not have emitted any event");
    });

    it("Should not remove an address that is not blacklisted", async () => {
        const receipt = await token.removeBlackList(user1, { from: owner });

        const isBlackListed = await token.isBlackListed(user1);
        assert.isFalse(isBlackListed, "User1 should not be blacklisted");

        // Check if no Whitelisted event was emitted
        assert.equal(receipt.logs.length, 0, "should not have emitted any event");
    });

    it("Should not allow non-owner to add to the blacklist", async () => {
        try {
            await token.addBlackList(user2, { from: nonOwner });
            assert.fail("Non-owner should not be able to add to the blacklist");
        } catch (error) {
            assert.include(error.message, "revert", "Expected revert, got: " + error.message);
        }

        const isBlackListed = await token.isBlackListed(user2);
        assert.isFalse(isBlackListed, "User2 should not be blacklisted");
    });

    it("Should not allow non-owner to remove from the blacklist", async () => {
        await token.addBlackList(user2, { from: owner });

        try {
            await token.removeBlackList(user2, { from: nonOwner });
            assert.fail("Non-owner should not be able to remove from the blacklist");
        } catch (error) {
            assert.include(error.message, "revert", "Expected revert, got: " + error.message);
        }

        const isBlackListed = await token.isBlackListed(user2);
        assert.isTrue(isBlackListed, "User2 should remain blacklisted");
    });

    it("Prevent blacklisted addresses from transferring tokens", async () => {
        await token.mint(user1, 1000, { from: owner });
        await token.addBlackList(user1, { from: owner });

        try {
            await token.transfer(user2, 100, { from: user1 });
            assert.fail("Blacklisted user should not be able to transfer tokens");
        } catch (error) {
            assert.include(error.message, "revert", "Expected revert, got: " + error.message);
        }

        const balanceUser1 = await token.balanceOf(user1);
        const balanceUser2 = await token.balanceOf(user2);

        assert.equal(balanceUser1.toNumber(), 1000, "User1 balance should remain the same");
        assert.equal(balanceUser2.toNumber(), 0, "User2 balance should remain the same");
    });

    it("Allow non-blacklisted addresses to transfer tokens", async () => {
        await token.mint(user1, 1000, { from: owner });
        await token.transfer(user2, 100, { from: user1 });

        const balanceUser1 = await token.balanceOf(user1);
        const balanceUser2 = await token.balanceOf(user2);

        assert.equal(balanceUser1.toNumber(), 900, "User1 should have 900 tokens");
        assert.equal(balanceUser2.toNumber(), 100, "User2 should have 100 tokens");
    });

    it("Allow the owner to burn tokens", async () => {
        await token.mint(user1, 1000, { from: owner });
        await token.burn(500, { from: user1 });

        const balanceUser1 = await token.balanceOf(user1);
        assert.equal(balanceUser1.toNumber(), 500, "User1 should have 500 tokens left after burning");
    });

    it("should not allow non-owner to mint tokens", async () => {
        try {
            await token.mint(user2, 1000, { from: nonOwner });
            assert.fail("Non-owner should not be able to mint tokens");
        } catch (error) {
            assert.include(error.message, "revert", "Expected revert, got: " + error.message);
        }

        const balanceUser2 = await token.balanceOf(user2);
        assert.equal(balanceUser2.toNumber(), 0, "User2 should not have any tokens");
    });

    it("should have correct initial token name and symbol", async () => {
        const name = await token.name();
        const symbol = await token.symbol();

        assert.equal(name, "TestToken", "Token name should be 'TestToken'");
        assert.equal(symbol, "TTK", "Token symbol should be 'TTK'");
    });
});

