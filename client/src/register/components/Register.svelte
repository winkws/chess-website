<script>
    function SignIn(){
      location.href = "/login";
    }
    function Register(){
      const username = document.getElementById("username-input").value;
      const email = document.getElementById("email-input").value;
      const password = document.getElementById("password-input").value;
      fetch('http://localhost:3000/registerUser', {
          headers: {
              'Content-type': 'application/json'
          },
          method: 'POST',
          body: JSON.stringify({
              username : username,
              email : email,
              password : password,
          })
      })
      .then(response => response.json())
        document.getElementById("username-input").value = "";
        document.getElementById("email-input").value = "";
        document.getElementById("password-input").value = "";
        alert("Account registered");
      }
  </script>
  
  <style>
    #login-wrapper{
      position: absolute;
      color:white;
      font-family: Roboto;
      font-size: 2vmin;
      border:0.25vmin solid black;
      border-radius: 1vmin;
      background-color: rgb(50,50,50);
      width: 40vmin;
      height: 50vmin;
      left: 50%;
      top: 50%;
      transform: translate(-50%,-50%);
    }
    #username-wrapper{
      position: relative;
      margin-top:10%;
      margin-left: 22.5%;
    }
    #email-wrapper{
      position: relative;
      margin-top:10%;
      margin-left: 22.5%;
    }
    #password-wrapper{
      position: relative;
      margin-top:10%;
      margin-left: 22.5%;
    }
    #signin{
      position: relative;
      margin-top:12.5%;
      margin-left: 40%;
      user-select: none;
    }
    #register-button{
      position: relative;
      margin-top:12.5%;
      margin-left: 35%;
      width: 10vmin;
      height: 4vmin;
      font-size: 2vmin;
      font-weight: bold;
    }
    input{
        width: 20vmin;
        height: 3vmin;
        font-size: 2vmin;
    }
  </style>
  
  <div id = "login-wrapper">
    <div id = "username-wrapper">
      <label for = "username-input">Username</label><br>
      <input id = "username-input">
    </div>
    <div id = "email-wrapper">
      <label for = "email-input">Email</label><br>
      <input id = "email-input">
    </div>
    <div id = "password-wrapper">
      <label for = "password-input">Password</label><br>
      <input id = "password-input" type = "password" autocomplete="off" max = "256"><br>
    </div>
    <div id = "signin" on:click={SignIn}>Sign in</div>
    <button id = "register-button" on:click={Register}>Register</button>
  </div>