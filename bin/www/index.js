'use strict'

const btns = document.getElementsByClassName('web-tree-btn')

for (const btn of btns) {
  btn.addEventListener('click', () => {
    btn.classList.toggle('active')

    const div = btn.nextElementSibling

    if (!div.style.display || div.style.display === 'none') {
      div.style.display = 'block'
      return
    }

    div.style.display = 'none'

    const btns = div.querySelectorAll('.web-tree-btn')
    const divs = div.querySelectorAll('.web-tree-div')

    for (const btn of btns) {
      btn.classList.remove('active')
    }

    for (const div of divs) {
      div.style.display = 'none'
    }
  })
}
