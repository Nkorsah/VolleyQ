import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="page">

    <header class="navbar">
      <div class="logo">Logo</div>

      <div class="nav-right">
        <a href="#">Home</a>
        <a href="#">Profile</a>
        <a href="#">Settings</a>
        <button class="logout">Logout</button>
        <img class="avatar" src="https://i.pravatar.cc/40">
      </div>
    </header>

    <main class="hero">
        <h1>Welcome back Christine!</h1>
        <button class="cta">Find a Game</button>
    </main>

  </div>
`