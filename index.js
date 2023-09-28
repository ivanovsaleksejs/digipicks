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

const texts = {
  "tutorhead": "Welcome to the lockpicking game!",
  "tutor1": "This game is inspired by the lockpicking minigame in Starfield by Bethesda Game Studios.",
  "tutor2": "If you are familiar with that minigame or with this game, or if you feel confident, then you can skip this tutorial and start playing.",
  "tutornext": "Next",
  "tutorskip": "Skip",
  "tutorend": "Got it!",
  "tutorlockhead": "This is the lock that you have to unlock",
  "tutorlock1": "It has multiple layers depending on difficulty. You need to unlock all of them in order.",
  "tutorlock2": "The outside (dashed) ring represents the currently selected pick. Use your keyboard or click buttons below lock to rotate it.",
  "tutorlock3": "Rotate pick so it fits with gaps on the outer ring. Once it is in a correct position, apply it using keyboard or click on a button below lock.",
  "tutorlock4": "If you use it in the wrong position, then it will fail, in which case, the number of attempts decreases.",
  "tutorpickshead": "These are the picks you can use",
  "tutorpicks1": "Picks are shuffled and rotated randomly.",
  "tutorpicks2": "Move between them using keyboard, or you can simply click or tap on the pick that you want to use.",
  "tutorpicks3": "Once you've chosen the pick, rotate it to fit in gaps and then apply it. Each layer will require at least two picks to unlock it.",
  "tutorpicks4": "It's recommended to use a pick only after you are sure that you have all the picks to unlock the layer.",
  "tutorpicks5": "If, when solving, you've realized that you used the wrong pick before, you can go back one step. In this case, the number of attempts decreases.",
  "tutorsettingshead": "These are game settings",
  "tutorsettings1": "The difficulty level defines how many layers you need to unlock - 2 for Novice and Advanced, 3 for Expert and 4 for Master.",
  "tutorsettings2": "For Novice, all picks should be used. For Advanced, Expert and Master there are extra picks that make your job harder and should not be used. You'll need to figure out by yourself what picks to use",
  "tutorsettings3": "The seed field defines unique game. You can randomize seed and later share it with friends",
  "tutorsettings4": "If you play on the computer then you'll see the keybinding block. You can change key bingings for all interactions if you want.",
  "tutorsettings5": "At the right side you can see how many attempts you have left. This number decreases when you do a mistake or if you go one step back.",
  "tutorendhead": "You're ready to go!",
  "tutorend1": "Hope you'll enjoy playing. GLHF!"
}

const tutorialSolve = [
  ['rcw', 200],
  ['rcw', 400],
  ['rccw', 200],
  ['rccw', 200],
  ['rccw', 500],
  ['rccw', 200],
  ['rccw', 100],
  ['rccw', 200],
  ['rccw', 200],
  ['rccw', 200],
  ['use', 500]
]

const tutorialMove = [
  ['next', 300],
  ['next', 400],
  ['prev', 500],
  ['next', 200],
  ['next', 300],
]

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

const createNode = (name = 'div', props = {}, listeners = {}) => {
  let node = document.createElement(name)
  Object.assign(node, props)
  for (let [event, [listener, options]] of Object.entries(listeners)) {
    node.addEventListener(event, listener, options)
  }
  return node
}

const addSegments = (lock, pattern, isPick = false) => {
  let skew = [79.75, 85][+isPick]
  let offset = 22.5
  for (let i in pattern) {
    if (pattern[i]) {
      let node = createNode('div', {className: 'segment'})
      node.style.transform = `rotate(${(offset * i + isPick * 2.5).toFixed(2)}deg) skew(${skew.toFixed(2)}deg)`
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

  let pickNodeCircle = createNode('div', {className: 'lock-outer-circle' + (pick.used ? ' disabled' : '')})

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

const generateGame = difficulty => {
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

  document.querySelector('#picks-left').innerText = state.pickCount
}

const drawPickAroundLock = _ => drawPick(state.picks[state.activePick])

const rotateSegment = direction => p => {
  let s = p.style.transform
  let d = direction ? -22.5 : 22.5
  let r = +s.match(/rotate\((-?\d*\.?\d*)/)[1] + d
  p.style.transform = s.replace(/rotate\((-?\d*\.?\d*)/, 'rotate(' + r.toFixed(2))
}

const rotateActivePick = direction => {
  let rotation = state.picks[state.activePick].rotation
  rotation += direction ? 1 : (-1)
  rotation = rotation == 16 ? 0  : rotation
  rotation = rotation == -1 ? 15 : rotation
  state.picks[state.activePick].rotation = rotation
  let selectors = [
    `.picks > div:nth-child(${state.activePick+1}) .segment`,
    `.lock.top .lock-outer.pick > div > .lock-outer-circle > .segment`
  ]
  document.querySelectorAll(selectors.join()).forEach(rotateSegment(direction))
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
      document.querySelector('#picks-left').innerText = state.pickCount
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
  let mistakes = config.pickCount[state.difficulty-1] - state.pickCount
  let time = convertTime()
  let message = [
    `<p>Congratulations!</p>`,
    `<p>Mistakes: ${mistakes}</p>`,
    `<p>Time: ${time}</p>`
  ]
  if (state.daily) {
    let tweet = `I cracked the daily puzzle in ${time}` + (mistakes ? (` with ${mistakes} mistakes`) : ` without any mistake`) + ".\n "
      + 'Can you beat my time?\n '
      + 'https://ivanovsaleksejs.github.io/sfminigame/?daily=1'
    message.push(`<p>Share your result:</p>`)
    message.push(`<a class="twitter-share-button" target="blank" href="https://twitter.com/intent/tweet/?text=${tweet}">Tweet</a>`)
  }
  let popup = openPopup("&#128578;", message.join(''), endgameButtons(true, true))
}

const endgameButtons = (won = false, daily = false) => {
  let buttons = createNode('div', {className: 'popup-buttons'})

  let tryAgain = createNode('button', {className: 'popup-button', innerText: "Try again"},
    {
      'click': [_ => {
        closePopup()
        initGame(null, null, 1)
      }, {}]
    }
  )
  buttons.appendChild(tryAgain)

  let newGame = createNode('button', {className: 'popup-button', innerText: "New game"},
    {
      'click': [_ => {
        closePopup()
        document.querySelector('#randomseed').dispatchEvent((new Event('click')))
      }, {}]
    }
  )
  buttons.appendChild(newGame)

  return buttons
}

const openPopup = (sign, text, buttons) => {
  document.querySelectorAll('.header, .lock.top, .rotate-buttons, .picks').forEach(e => e.classList.add('blurred'))
  let popup = createNode('div', {className: 'popup'})

  /*let popupClose = createNode('div', {className: 'popup-close'},
    {
      'click': [closePopup, {}]
    }
  )
  popup.appendChild(popupClose)*/
  let message = createNode('div', {className: 'popup-message'})

  if (sign) {
    let icon = createNode('div', {className: 'popup-icon', innerHTML: sign})
    message.appendChild(icon)
  }

  let textNode = createNode('p', {innerHTML: text})
  message.appendChild(textNode)
  popup.appendChild(message)

  popup.appendChild(buttons)

  document.body.appendChild(popup)
  return popup
}

const closePopup = _ => {
  document.querySelectorAll('.header, .lock.top, .rotate-buttons, .picks').forEach(e => e.classList.remove('blurred'))
  state.binding = false
  document.querySelectorAll('.popup').forEach(e => e.remove())
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
  let cancel = createNode('button', {className: 'popup-button', innerText: "Cancel"},
    {
      'click': [closePopup, {}]
    }
  )
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

const convertTime = _ => {
  let dateDiff = Date.now() - state.timeStart
  let time = [(dateDiff / 3600000) % 24, (dateDiff / 60000) % 60, (dateDiff / 1000) % 60].map(x => (x>>>0).toString().padStart(2, '0'))
  if (time[0] == '00') {
    time.shift()
  }
  return time.join(':')
}

const updateTime = _ => {
  document.querySelector('#time').innerHTML = convertTime()
}

const initGame = (pseed = null, pdifficulty = null, daily = null) => {
  closePopup()
  let seedField = document.querySelector('#seed')
  state.daily = false
  if (daily) {
    state.daily = true
    seedField.value = (rnd(Date.now() / 86400000 >>> 0))() * seedField.max >>> 0
    document.querySelector('#master').checked = true
  }
  let seed = pseed ?? seedField.value
  let difficulty = daily ? 4 : (pdifficulty ?? +[...document.querySelectorAll("[name=difficulty]")].find(r => r.checked).value ?? 1)

  state.difficulty = difficulty
  state.rand = rnd(seed)
  state.activePick = 0
  state.pickCount = config.pickCount[difficulty - 1]
  document.querySelector('#picks-left').innerText = state.pickCount

  state.history = []
  generateGame(difficulty)
  redraw()
  state.timeStart = Date.now()
  state.timerInterval = setInterval(updateTime, 100);
}

const clickOnPick = e => {
  let target = e.target
  while (!target.classList.contains('pick')) {
    if (target.classList.contains('picks')) {
      return
    }
    target = target.parentNode
  }

  let selectedPick = [...target.closest(".picks").children].indexOf(target.parentNode)
  if (!state.picks[selectedPick].used) {
    state.activePick = [...target.closest(".picks").children].indexOf(target.parentNode)
    redraw()
  }
}

const tutorialButtons = (tutor, nextPhase) => {
  let tutorbuttons = createNode('div', {className: 'tutorbuttons'})
  let tutornext = createNode('button', {className: 'tutor-button', innerText: texts.tutornext},
    {
      'click': [nextPhase, {once: true}]
    }
  )
  tutorbuttons.appendChild(tutornext)
  let tutorskip = createNode('a', {className: 'tutor-link', innerText: texts.tutorskip},
    {
      'click': [skipTutorial(tutor), {}]
    }
  )
  tutorbuttons.appendChild(tutorskip)
  return tutorbuttons
}

const showTutorial = _ => {
  state.tutorialActive = true
  document.querySelectorAll('.header, .lock.top, .rotate-buttons, .picks').forEach(e => e.classList.add('blurred'))
  let tutor = createNode('div', {className: 'tutorial intro hidden'})
  let tutorhead = createNode('h1', {innerText: texts.tutorhead})
  tutor.appendChild(tutorhead)

  let tutor1 = createNode('p', {innerText: texts.tutor1})
  tutor.appendChild(tutor1)
  let tutor2 = createNode('p', {innerText: texts.tutor2})
  tutor.appendChild(tutor2)

  tutor.appendChild(tutorialButtons(tutor, showTutorialLock(tutor)))
  setTimeout(_ => tutor.classList.remove('hidden'), 10)

  document.body.appendChild(tutor)
}

const showTutorialLock = tutor => _ => {
  tutor.addEventListener('transitionend', _ => tutor.remove())
  setTimeout(_ => tutor.classList.add('hidden'), 10)
  document.querySelectorAll('.lock.top, .rotate-buttons').forEach(e => e.classList.remove('blurred'))

  let tutorLock = createNode('div', {className: 'tutorial tutorlock hidden'})

  let tutorhead = createNode('h1', {innerText: texts.tutorlockhead})
  tutorLock.appendChild(tutorhead)

  let tutorDesc = createNode('div')

  let tutor1 = createNode('p', {innerText: texts.tutorlock1})
  tutorDesc.appendChild(tutor1)
  let tutor2 = createNode('p', {innerText: texts.tutorlock2})
  tutorDesc.appendChild(tutor2)
  tutorLock.appendChild(tutorDesc)

  tutorLock.appendChild(tutorialButtons(tutorLock, showTutorialLockPick(tutorLock, tutorDesc)))

  setTimeout(_ => tutorLock.classList.remove('hidden'), 10)
  document.body.appendChild(tutorLock)
}

const showTutorialLockPick = (tutorLock, tutorDesc) => _ => {
  let tutor3 = createNode('p', {innerText: texts.tutorlock3})
  tutorDesc.appendChild(tutor3)
  let f = (timeout, i = 0) => _ => {
    if (t = tutorialSolve[i] ?? null) {
      state.commands[t[0]].method()
      timeout.t = setTimeout(f(timeout, i + 1), t[1])
    }
  }
  let timeout = {t: null}
  timeout.t = f(timeout)()
  tutorLock.querySelector('.tutor-link').addEventListener('click', _ => clearTimeout(timeout.t))
  tutorLock.querySelector('.tutor-button').addEventListener('click', showTutorialPicks(tutorLock, timeout), {once: true})
}

const showTutorialPicks = (tutorLock, timeout) => _ => {
  clearTimeout(timeout.t)
  tutorLock.addEventListener('transitionend', _ => tutorLock.remove())
  setTimeout(_ => tutorLock.classList.add('hidden'), 10)
  document.querySelectorAll('.lock.top, .rotate-buttons').forEach(e => e.classList.add('blurred'))
  document.querySelectorAll('.picks').forEach(e => e.classList.remove('blurred'))

  let tutorPicks = createNode('div', {className: 'tutorial tutorpicks hidden'})

  let tutorhead = createNode('h1', {innerText: texts.tutorpickshead})
  tutorPicks.appendChild(tutorhead)

  let tutorDesc = createNode('div')

  let tutor1 = createNode('p', {innerText: texts.tutorpicks1})
  tutorDesc.appendChild(tutor1)
  let tutor2 = createNode('p', {innerText: texts.tutorpicks2})
  tutorDesc.appendChild(tutor2)
  tutorPicks.appendChild(tutorDesc)
  tutorPicks.appendChild(tutorialButtons(tutorPicks, showTutorialPicksNext(tutorPicks, tutorDesc)))
  setTimeout(_ => tutorPicks.classList.remove('hidden'), 10)
  document.body.appendChild(tutorPicks)
}

const showTutorialPicksNext = (tutorPicks, tutorDesc) => _ => {
  let tutor3 = createNode('p', {innerText: texts.tutorpicks3})
  tutorDesc.appendChild(tutor3)
  let tutor4 = createNode('p', {innerText: texts.tutorpicks4})
  tutorDesc.appendChild(tutor4)
  let tutor5 = createNode('p', {innerText: texts.tutorpicks5})
  tutorDesc.appendChild(tutor5)
  let f = (timeout, i = 0) => _ => {
    if (t = tutorialMove[i] ?? null) {
      state.commands[t[0]].method()
      timeout.t = setTimeout(f(timeout, i + 1), t[1])
    }
  }
  let timeout = {t: null}
  timeout.t = f(timeout)()
  tutorPicks.querySelector('.tutor-link').addEventListener('click', _ => clearTimeout(timeout.t))
  tutorPicks.querySelector('.tutor-button').addEventListener('click', showTutorialSettings(tutorPicks, timeout), {once: true})
}

const showTutorialSettings = (tutorPicks, timeout) => _ => {
  clearTimeout(timeout.t)
  tutorPicks.addEventListener('transitionend', _ => tutorPicks.remove())
  setTimeout(_ => tutorPicks.classList.add('hidden'), 10)
  document.querySelectorAll('.lock.top, .rotate-buttons, .picks').forEach(e => e.classList.add('blurred'))
  document.querySelectorAll('.header').forEach(e => e.classList.remove('blurred'))

  let tutorSettings = createNode('div', {className: 'tutorial settings hidden'})
  let tutorhead = createNode('h1', {innerText: texts.tutorsettingshead})
  tutorSettings.appendChild(tutorhead)

  let tutor1 = createNode('p', {innerText: texts.tutorsettings1})
  tutorSettings.appendChild(tutor1)
  let tutor2 = createNode('p', {innerText: texts.tutorsettings2})
  tutorSettings.appendChild(tutor2)
  let tutor3 = createNode('p', {innerText: texts.tutorsettings3})
  tutorSettings.appendChild(tutor3)
  let tutor4 = createNode('p', {innerText: texts.tutorsettings4})
  tutorSettings.appendChild(tutor4)
  let tutor5 = createNode('p', {innerText: texts.tutorsettings5})
  tutorSettings.appendChild(tutor5)

  tutorSettings.appendChild(tutorialButtons(tutorPicks, showTutorialEnd(tutorSettings)))

  setTimeout(_ => tutorSettings.classList.remove('hidden'), 10)

  document.body.appendChild(tutorSettings)
}

const showTutorialEnd = tutorSettings => _ => {
  tutorSettings.addEventListener('transitionend', _ => tutorSettings.remove())
  setTimeout(_ => tutorSettings.classList.add('hidden'), 10)
  document.querySelectorAll('.header, .lock.top, .rotate-buttons, .picks').forEach(e => e.classList.add('blurred'))
  let tutor = createNode('div', {className: 'tutorial intro hidden'})
  let tutorhead = createNode('h1', {innerText: texts.tutorendhead})
  tutor.appendChild(tutorhead)

  let tutor1 = createNode('p', {innerText: texts.tutorend1})
  tutor.appendChild(tutor1)

  let tutorbuttons = createNode('div', {className: 'tutorbuttons'})
  let tutorskip = createNode('a', {className: 'tutor-link', innerText: texts.tutorend},
    {
      'click': [skipTutorial(tutor), {}]
    }
  )
  tutorbuttons.appendChild(tutorskip)
  tutor.appendChild(tutorbuttons)

  setTimeout(_ => tutor.classList.remove('hidden'), 10)

  document.body.appendChild(tutor)
}

const skipTutorial = tutor => _ => {
  state.tutorialActive = false
  localStorage.setItem("tutorSeen", true)
  tutor.addEventListener('transitionend', _ => tutor.remove())
  setTimeout(_ => tutor.classList.add('hidden'), 10)
  document.querySelectorAll('.header, .lock.top, .rotate-buttons, .picks').forEach(e => e.classList.remove('blurred'))
  initGame()
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

  document.querySelector('.settings').addEventListener('change', initGame.bind(null, null, null, null))

  document.querySelector('#randomseed').addEventListener('click', _ => {
    let seedInput = document.querySelector('#seed')
    seedInput.value = (Math.random() * seedInput.max) >>> 0
    initGame()
  })
  document.querySelector('#daily').addEventListener('click', initGame.bind(null, null, null, 1))

  document.querySelector('#rotate_ccw').addEventListener('click', state.commands.rccw.method)
  document.querySelector('#rotate_cw').addEventListener('click', state.commands.rcw.method)
  document.querySelector('#button_use').addEventListener('click', state.commands.use.method)
  document.querySelector('#button_undo').addEventListener('click', state.commands.undo.method)

  document.querySelector('.picks').addEventListener('click', clickOnPick)

  document.querySelector('.bindings').addEventListener('click', showBindingPopup)

  document.querySelector('#help').addEventListener('click', showTutorial)

  let urlParams = [...(new URLSearchParams(window.location.search))]
  let params = {seed: null, difficulty: null, daily: null}
  urlParams.map(p => params[p[0]] = +p[1])

  initGame(params.seed, params.difficulty, params.daily)

  if (!localStorage.getItem("tutorSeen")) {
    setTimeout(showTutorial, 200)
  }
})

window.addEventListener("keydown", event =>
  {
    if (state.tutorialActive) {
      return
    }
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
