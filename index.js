const config = {
  pickCount: [5, 7, 9, 11],
  gaps: [
    [3, 3],
    [4, 5],
    [4, 5],
    [5, 7]
  ],
  keyNames: {
    16: "Shift",
    17: "Ctrl",
    18: "Alt",
    91: "Win",
    225: "Alt Gr"
  },
  arrows: {
    37: "&#8592;",
    38: "&#8593;",
    39: "&#8594;",
    40: "&#8595;"
  }
}

const rnd = seed => (
  rndstate = seed,
  _ => (
    rndstate = Math.sin(rndstate) * 10000, rndstate - Math.floor(rndstate)
  )
)

const allIndices = (x, l) => {
  let indices = []
  let i = -1
  while ((i = l.indexOf(x, i + 1)) !== -1) {
    indices.push(i)
  }
  return indices
}

const shuffle = l => {
  for (let j = 0; j < 2; j++) {
    for (let i = 0; i < l.length; i++) {
      let tmp = l[i]
      l[i] = l[(r = state.rand() * l.length >>> 0)]
      l[r] = tmp
    }
  }
  return l
}

const turnBits = l => [...Array(16)].map((_, i) => +(l.indexOf(i) != -1))

const rotate = (l, r) => [...l.slice(r), ...l.slice(0, r)]

const pickRandom = l => l[Math.floor(state.rand() * l.length)]

const createNode = (name = 'div', props = {}) => {
  let node = document.createElement(name)
  Object.assign(node, props)
  return node
}

const addSegments = (lock, pattern, isPick = false) => {
  let skew = [79.75, 84][+isPick]
  let offset = [22.5, 22.75][+isPick]
  for (let i in pattern) {
    if (pattern[i]) {
      let node = createNode('div', {className: 'segment'})
      node.style.transform = `rotate(${(offset * i).toFixed(2)}deg) skew(${skew.toFixed(2)}deg)`
      lock.appendChild(node)
    }
  }
}

const drawLock = (lock, pattern) => {
  let lockOuter = createNode('div', {className: 'lock-outer'})

  let lockAround = createNode('div')

  let lockOuterCircle = createNode('div', {className: 'lock-outer-circle'})

  let inner = createNode('div', {className: 'lock-inner'})

  lockOuterCircle.appendChild(inner)
  addSegments(lockOuterCircle, pattern)
  lockAround.appendChild(lockOuterCircle)
  lockOuter.appendChild(lockAround)

  lock.appendChild(lockOuter)
}

const drawPick = pick => {
  let pickNode = createNode('div', {className: "lock-outer pick"})

  let pickNodeCircle = createNode('div', {className: 'lock-outer-circle'})

  if (!pick.used) {
    addSegments(pickNodeCircle, rotate(turnBits(pick.pick), pick.rotation), true)
  }

  let inner = createNode('div', {className: 'lock-inner'})
  pickNodeCircle.appendChild(inner)

  let pickNodeAround = createNode('div')
  pickNodeAround.appendChild(pickNodeCircle)

  pickNode.appendChild(pickNodeAround)

  let wrapper = createNode('div')
  wrapper.appendChild(pickNode)

  return wrapper
}

const drawPicks = _ => {
  let picksNode = document.querySelector('.picks')
  picksNode.innerHTML = ''

  for (let pick of state.picks) {
    let wrapper = drawPick(pick)

    picksNode.appendChild(wrapper)
  }
  picksNode.querySelectorAll('.pick')[state.activePick].classList.add('active')
}

const generateGame = (seed, difficulty) => {
  let ringCount = difficulty > 1 ? difficulty : 2
  state.picks = []
  state.patterns = []

  for (let i = 0; i < ringCount; i++) {
    let gapCount = pickRandom(((x, y) => [...Array(y).keys()].map(i => i + x)).apply(null, config.gaps[difficulty - 1]))

    let positions = shuffle([...Array(16).keys()]).slice(0, gapCount)
    let pattern = turnBits(positions)
    let bitCount = pattern.reduce((a, x) => a + x)
    state.patterns.push(pattern)

    let chunk = ((bitCount / 2) >>> 0) - Math.round(state.rand() * ((bitCount / 8) >>> 0))
    let indicies = shuffle(allIndices(1, pattern))
    let picks = [
      {pick: indicies.slice(0, chunk), used:false, useful: true, layer: i, rotation: (state.rand() * 16) >>> 0},
      {pick: indicies.slice(chunk), used: false, useful: true, layer: i, rotation: (state.rand() * 16) >>> 0}
    ]

    if (difficulty > 1) {
      let fakechunk = (bitCount / 2 >>> 0) - Math.round(state.rand() * (bitCount / 8 >>> 0))
      let fake = {pick: shuffle(indicies).slice(0, fakechunk), used: false, rotation: (state.rand() * 16) >>> 0}
      picks.push(fake)
    }

    state.picks = state.picks.concat(picks)
  }

  state.picks = shuffle(state.picks)
}

const redraw = _ => {
  let lock = document.querySelector('.lock.top')
  lock.innerHTML = ''
  let pick = drawPickAroundLock()
  lock.appendChild(pick)
  lock = pick.querySelector('.lock-inner')

  for (let i in state.patterns) {
    let pattern = state.patterns[i]
    drawLock(lock, pattern)
    if (i < state.patterns.length - 1) {
      let newLayer = createNode('div', {className: 'lock'})
      lock.querySelector('.lock-inner').appendChild(newLayer)
      lock = newLayer
    }
  }

  drawPicks()

  document.querySelector('.picks-left').innerText = state.pickCount
}

const drawPickAroundLock = _ => drawPick(state.picks[state.activePick])

const rotateActivePick = direction => {
  let rotation = state.picks[state.activePick].rotation
  rotation += direction ? 1 : (-1)
  rotation = rotation == 16 ? 0  : rotation
  rotation = rotation == -1 ? 15 : rotation
  state.picks[state.activePick].rotation = rotation
  redraw()
}

const browsePicks = direction => {
  let activePick = state.activePick
  let unusedPicks = state.picks.filter(pick => pick.used == false)
  let d = direction ? 1 : -1
  if (unusedPicks.length > 1) {
    do {
      activePick += d
      activePick = activePick == -1 ? state.picks.length - 1 : activePick
      activePick = activePick == state.picks.length ? 0 : activePick
    }
    while (state.picks[activePick].used)
    state.activePick = activePick
    redraw()
  }
}

const attemptPick = _ => {
  if (state.pickCount > 0) {
    let pattern = state.patterns[0]
    let pick = state.picks[state.activePick]
    pick = rotate(turnBits(pick.pick), pick.rotation)
    success = true
    for (let bit in pattern) {
      success &= pick[bit] && pattern[bit] || !pick[bit]
    }
    if (success) {
      state.history.push(JSON.parse(JSON.stringify({
        patterns: state.patterns,
        picks: state.picks,
      })))
      state.picks[state.activePick].used = true
      for (let p in state.picks) {
        if (!state.picks[p].used) {
          state.activePick = +p
          break
        }
      }
      for (let bit in pattern) {
        pattern[bit] = pattern[bit] && pick[bit] ? 0 : pattern[bit]
      }
      if (pattern.every(x => !x)) {
        state.patterns.shift()
        if (state.patterns.length == 0) {
          showSuccessMessage()
        }
      }
      else {
        state.patterns[0] = pattern
      }
      animateCorrect(_ => {
        redraw()
      })
    }
    else {
      state.pickCount--
      document.querySelector('.picks-left').innerText = state.pickCount
      animateWrong()
      if (state.pickCount <= 0) {
        showLostMessage()
      }
    }
  }
  else {
    showLostMessage()
  }
}

const animateWrong = _ => {
  let currentPick = document.querySelector('.lock.top .pick > div > .lock-outer-circle')
  currentPick.addEventListener('transitionend', stopAnimateWrong)
  currentPick.classList.add('wrong')
}

const stopAnimateWrong = event => {
  let target = event.target
  if (target.classList.contains('wrong')) {
    target.classList.remove('wrong')
    target.removeEventListener('transitionend', stopAnimateWrong)
  }
}

const animateCorrect = next => {
  let currentPick = document.querySelector('.lock.top .pick > div > .lock-outer-circle')
  currentPick.addEventListener('transitionend', stopAnimateCorrect(next))
  currentPick.classList.add('correct')
}

const stopAnimateCorrect = next => event => {
  let target = event.target
  if (target.classList.contains('correct')) {
    target.classList.remove('correct')
    target.removeEventListener('transitionend', stopAnimateCorrect)
  }
  if (next) {
    next()
  }
}

const showLostMessage = _ => {
  let popup = openPopup("&#128577;", `Better luck next time!`, endgameButtons())
}

const showSuccessMessage = _ => {
  let picksUsed = config.pickCount[state.difficulty-1] - state.pickCount
  let popup = openPopup("&#128578;", `Congratulations! Failed attempts: ${picksUsed}`, endgameButtons())
}

const endgameButtons = _ => {
  let buttons = createNode('div', {className: 'popup-buttons'})

  let tryAgain = createNode('button', {className: 'popup-button'})
  tryAgain.innerText = 'Try again'
  tryAgain.addEventListener('click', _ => {
    closePopup()
    initGame()
  })
  buttons.appendChild(tryAgain)

  let newGame = createNode('button', {className: 'popup-button'})
  newGame.innerText = 'New game'
  newGame.addEventListener('click', _ => {
    closePopup()
    document.querySelector('#randomseed').dispatchEvent((new Event('click')))
  })
  buttons.appendChild(newGame)

  return buttons
}

const openPopup = (sign, text, buttons) => {
  let game = document.querySelector('.game')
  let popup = createNode('div', {className: 'popup'})

  let popupClose = createNode('div', {className: 'popup-close'})
  popupClose.addEventListener('click', closePopup)
  popup.appendChild(popupClose)

  let icon = createNode('div', {className: 'popup-icon'})
  icon.innerHTML = sign

  let textNode = createNode('div')
  textNode.innerText = text

  let message = createNode('div', {className: 'popup-message'})
  message.appendChild(icon)
  message.appendChild(textNode)
  popup.appendChild(message)

  popup.appendChild(buttons)

  game.appendChild(popup)
  return popup
}

const closePopup = _ => {
  state.binding = false
  document.querySelector('.popup').remove()
}

const undo = _ => {
  if (state.history.length > 0) {
    state.pickCount--
    if (state.pickCount > 0) {
      let prev = state.history.pop()
      state.patterns = prev.patterns
      state.picks = prev.picks
      redraw()
    }
    else {
      showLostMessage()
    }
  }
}

const showBindingPopup = e => {
  let command =e.target.htmlFor ? e.target.htmlFor : e.target.id

  let buttons = createNode('div', {className: 'popup-buttons'})
  let cancel = createNode('button', {className: 'popup-button'})
  cancel.innerText = 'Cancel'
  cancel.addEventListener('click', closePopup)
  buttons.appendChild(cancel)
  state.binding = true
  state.bindingCommand = command
  openPopup('', 'Press a key or combination', buttons)
}

const applyBinding = event => {
  let bind = {
    key: event.keyCode,
    ctrlKey: event.ctrlKey,
    altKey: event.altKey,
    shiftKey: event.shiftKey,
    metaKey: event.metaKey,
    method: state.commands[state.bindingCommand].method
  }
  state.commands[state.bindingCommand] = bind
  let keyName = (event.ctrlKey ? "Ctrl + " : '') +
    (event.altKey ? "Alt + " : '') +
    (event.shiftKey ? "Shift + " : '') +
    (event.metaKey ? "Cmd + " : '') +
    (config.arrows[event.keyCode] ? config.arrows[event.keyCode] : String.fromCharCode(event.keyCode))

  document.querySelector('.binding#' + state.bindingCommand).innerHTML = keyName
  state.binding = false
  state.bindingCommand = null
  closePopup()
}

const initGame = _ => {
  let seed = document.querySelector('#seed').value ?? 1
  let difficulty = +[...document.querySelectorAll("[name=difficulty]")].find(r => r.checked).value ?? 0
  state.difficulty = difficulty
  state.rand = rnd(seed)
  state.activePick = 0
  state.pickCount = config.pickCount[difficulty-1]
  document.querySelector('.picks-left').innerText = state.pickCount
  state.history = []
  generateGame(seed, difficulty)
  redraw()
}

const clickOnPick = e => {
  let target = e.target
  while (!target.classList.contains('pick')) {
    if (target.classList.contains('picks')) {
      return
    }
    target = target.parentNode
  }
  state.activePick = [...target.closest(".picks").children].indexOf(target.parentNode)
  redraw()
}

const state = {}

window.addEventListener("load", _ => {

  state.commands = {
    "rccw": {
      method: rotateActivePick.bind(null, true),
      key: 65
    },
    "rcw": {
      method: rotateActivePick.bind(null, false),
      key: 68
    },
    "prev": {
      method: browsePicks.bind(null, false),
      key: 37
    },
    "next": {
      method: browsePicks.bind(null, true),
      key: 39
    },
    "use": {
      method: attemptPick,
      key: 69
    },
    "undo": {
      method: undo,
      key: 90,
      ctrlKey: true
    }
  }

  document.querySelector('#seed').addEventListener('change', initGame)
  document.querySelector('fieldset').addEventListener('change', initGame)

  document.querySelector('#randomseed').addEventListener('click', _ => {
    let seedInput = document.querySelector('#seed')
    seedInput.value = (Math.random() * seedInput.max) >>> 0
    initGame()
  })

  document.querySelector('.picks').addEventListener('click', clickOnPick)

  document.querySelector('.bindings').addEventListener('click', showBindingPopup)

  initGame()
})

window.addEventListener("keydown", event =>
  {
    if (state.binding) {
      if (!config.keyNames[event.keyCode]) {
        applyBinding(event)
        event.preventDefault()
      }
    }
    else {
      let handled = false
      if ((command = Object.entries(state.commands).filter(c => c[1].key == event.keyCode)).length) {
        command = command[0][1]
        if (
          event.ctrlKey == !!command.ctrlKey &&
          event.shiftKey == !!command.shiftKey &&
          event.altKey == !!command.altKey &&
          event.metaKey == !!command.metaKey
        ) {
          command.method()
          handled = true
        }
      }

      if (handled) {
        event.preventDefault()
      }
    }
  },
  true
)
