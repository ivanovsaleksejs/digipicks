# Digipicks

A game based on the lockpicking minigame in Starfield, an action role-playing game developed by Bethesda Game Studios.

A playable version can be found [here](https://ivanovsaleksejs.github.io/digipicks).

## Rules

The aim of the game is to unlock all layers with the provided picks. Layers are circles with gaps in them placed randomly. Your goal is to find picks that fill all the gaps for a given layer.

Picks are shuffled and rotated randomly. You can browse picks with the keyboard or by simply clicking on them, and you can rotate each pick to fit with the gaps.

Each layer requires at least two picks to unlock it. Once you've unlocked the top layer, you gain access to the next layer, and so on, until you unlock them all.


https://github.com/ivanovsaleksejs/digipicks/assets/1484549/1bf57fde-ab15-4f12-a173-c8f24f750519


You can only use each pick once; after that, it becomes unavailable. So, make sure you've found all the picks for the layer before using them.

It's also possible that you've used a pick that was meant for another layer earlier in the game. This will block you from unlocking all the layers. In that case, you can go back as many steps as you want.

You have a limited number of failed attempts. Each time you try to use a pick in the wrong position (where it doesn't fit in the gaps), this number decreases. Each time you go one step back, this number decreases. Once you have used all the attempts, the game is lost.

Once you've unlocked all the layers, you will see the message that the game is won and how much time was used.

## Settings

The difficulty level represents how many layers to unlock - two for Novice and Advanced, three for Expert, and four for Master. The number of picks depends on the chosen level as well. For Advanced, Expert, and Master, there are extra picks that fit on some of the layers but don't have a pair, so if you use them, you may fail to unlock the layer.

The seed field, in combination with the difficulty level, defines a unique game. You can randomize the seed, or you can use the Daily task button that will generate a seed depending on today's date. You can copy and share the seed with friends.

If you use a computer, you will also see the keybinding section. You can change key bindings if you like.
