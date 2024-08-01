const fs = require('fs');
const path = require('path');

const jsonDirectory = './files/metadata'; // Update this path
const outputFile = './contracts/CardMetadataSetup.sol';

function getRarityEnum(rarity) {
    switch(rarity.toLowerCase()) {
        case 'common': return 'MythoriaTypes.Rarity.Common';
        case 'rare': return 'MythoriaTypes.Rarity.Rare';
        case 'epic': return 'MythoriaTypes.Rarity.Epic';
        case 'legendary': return 'MythoriaTypes.Rarity.Legendary';
        default: throw new Error(`Unknown rarity: ${rarity}`);
    }
}

function getAttributeValue(attributes, traitType, defaultValue = 0) {
    const attr = attributes.find(attr => attr.trait_type === traitType);
    return attr ? attr.value : defaultValue;
}

function generateSetupFunction() {
    let functionBody = "// SPDX-License-Identifier: MIT\n"
    functionBody+='pragma solidity ^0.8.19;\n\n';
    functionBody += 'import "./MythoriaCards.sol";\n';
    functionBody += 'import "./MythoriaTypes.sol";\n\n';
    functionBody += 'contract CardMetadataSetup {\n';
    functionBody += '    function setupCardMetadata(MythoriaCards mythoriaCards) external {\n';

    fs.readdirSync(jsonDirectory).forEach(file => {
        if (path.extname(file) === '.json') {
            const cardData = JSON.parse(fs.readFileSync(path.join(jsonDirectory, file), 'utf8'));
            const cardId = getAttributeValue(cardData.attributes, 'ID');
            const cardType = cardData.attributes.find(attr => ['Creature', 'Item', 'Pack'].includes(attr.trait_type))?.trait_type;
            const rarity = getAttributeValue(cardData.attributes, 'Rarity');
            
            let metadataString = `        mythoriaCards.updateCardMetadata(${cardId}, MythoriaTypes.CardMetadata({\n`;
            metadataString += `            name: "${cardData.name}",\n`;
            metadataString += `            cardType: "${cardType}",\n`;
            metadataString += `            rarity: ${getRarityEnum(rarity)},\n`;
            metadataString += `            attack: ${getAttributeValue(cardData.attributes, 'Attack')},\n`;
            metadataString += `            defense: ${getAttributeValue(cardData.attributes, 'Defense')},\n`;
            metadataString += `            hp: ${getAttributeValue(cardData.attributes, 'HP')},\n`;
            metadataString += `            speed: ${getAttributeValue(cardData.attributes, 'Speed')},\n`;
            metadataString += `            deploymentCost: ${getAttributeValue(cardData.attributes, 'Deployment Cost')},\n`;
            metadataString += `            attackCost: ${getAttributeValue(cardData.attributes, 'Attack Cost')},\n`;
            metadataString += `            evolutionStage: "${getAttributeValue(cardData.attributes, 'Evolution Stage', 'Basic')}",\n`;
            metadataString += `            nextEvolution: "${getAttributeValue(cardData.attributes, 'Next Evolution', '')}",\n`;
            metadataString += `            evolveFrom: "${getAttributeValue(cardData.attributes, 'Evolve From', '')}",\n`;
            metadataString += `            canEvolve: ${getAttributeValue(cardData.attributes, 'Can Evolve', false)},\n`;
            metadataString += `            isEvolved: ${getAttributeValue(cardData.attributes, 'Is evolved', false)},\n`;
            metadataString += `            speedBoost: ${getAttributeValue(cardData.attributes, 'Speed boost')},\n`;
            metadataString += `            attackBoost: ${getAttributeValue(cardData.attributes, 'Attack boost')},\n`;
            metadataString += `            defenceBoost: ${getAttributeValue(cardData.attributes, 'Defence boost')},\n`;
            metadataString += `            hpBoost: ${getAttributeValue(cardData.attributes, 'HP boost')},\n`;
            metadataString += `            damage: ${getAttributeValue(cardData.attributes, 'Damage')},\n`;
            metadataString += `            hpRecovery: ${getAttributeValue(cardData.attributes, 'HP Recovery')},\n`;
            metadataString += `            opponentAttackDecrease: ${getAttributeValue(cardData.attributes, "Opponent's Attack Decrease")},\n`;
            metadataString += `            opponentSpeedDecrease: ${getAttributeValue(cardData.attributes, "Opponent's Speed Decrease")},\n`;
            metadataString += `            opponentDefenceDecrease: ${getAttributeValue(cardData.attributes, "Opponent's Defence Decrease")},\n`;
            metadataString += `            canTrade: ${getAttributeValue(cardData.attributes, 'Can Trade', false)},\n`;
            metadataString += `            isAttachable: ${getAttributeValue(cardData.attributes, 'Is Attachable', false)},\n`;
            metadataString += `            manaGain: ${getAttributeValue(cardData.attributes, 'Mana Gain')},\n`;
            metadataString += `            commonCardsContained: ${getAttributeValue(cardData.attributes, 'Common Cards Contained')},\n`;
            metadataString += `            rareCardsContained: ${getAttributeValue(cardData.attributes, 'Rare Cards Contained')},\n`;
            metadataString += `            epicCardsContained: ${getAttributeValue(cardData.attributes, 'Epic Cards Contained')},\n`;
            metadataString += `            legendaryCardsContained: ${getAttributeValue(cardData.attributes, 'Legendary Cards Contained')}\n`;
            metadataString += '        }));\n\n';
            functionBody += metadataString;
        }
    });

    functionBody += '    }\n';
    functionBody += '}\n';
    return functionBody;
}

const generatedCode = generateSetupFunction();

fs.writeFileSync(outputFile, generatedCode);
console.log(`Generated ${outputFile}`);