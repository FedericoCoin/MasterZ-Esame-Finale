// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library MythoriaTypes {
    enum Rarity { Common, Rare, Epic, Legendary }

    struct CardMetadata {
        string name;
        string cardType;
        Rarity rarity;
        uint256 attack;
        uint256 defense;
        uint256 hp;
        uint256 speed;
        uint256 deploymentCost;
        uint256 attackCost;
        string evolutionStage;
        string nextEvolution;
        string evolveFrom;
        bool canEvolve;
        bool isEvolved;
        uint256 speedBoost;
        uint256 attackBoost;
        uint256 defenceBoost;
        uint256 hpBoost;
        uint256 damage;
        uint256 hpRecovery;
        uint256 opponentAttackDecrease;
        uint256 opponentSpeedDecrease;
        uint256 opponentDefenceDecrease;
        bool canTrade;
        bool isAttachable;
        uint256 manaGain;
        uint256 commonCardsContained;
        uint256 rareCardsContained;
        uint256 epicCardsContained;
        uint256 legendaryCardsContained;
    }
}