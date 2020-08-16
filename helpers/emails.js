exports.otpSend = function (otp) {
    const html =
        `<div style="background-color: #49A69A">
            <img src="https://www.zupimages.net/up/20/33/hu8k.png" alt="logo"height="30" style="padding-top: 15px; padding-bottom: 10px; padding-left: 20px">
        </div>
        <div style="background-color: #2D404E; padding-top: 15px; padding-bottom: 25px">
            <table style="width:100%">
               <tr>
                <th>
                  <h1 style="color: #fff">Votre code de confirmation</h1>
                  <p style="color: #fff">
                  Saisissez le code de confirmation pour activer votre compte.
                  </p>
                  <p style="  border: none;
                              color: #2D404E;
                              padding: 10px 15px;
                              text-align: center;
                              display: inline-block;
                              font-size: 16px;
                              margin: 4px 2px;
                              background-color: #fff;
                              border-radius: 25px;">
                    ${otp}
                </p>
                </th>
                <th>
                  <img src="https://zupimages.net/up/20/33/9esh.png" alt="logo" height="150px">
                </th>
              </tr>
             </table>
            </div>
            <div style="background-color: #FFFFFF; padding-top: 15px; padding-bottom: 10px">
             <table style="width:100%">
               <tr>
                <th>
                  <img src="https://zupimages.net/up/20/33/asu3.jpg" alt="logo" height="200px">
                </th>
                 <th>
                  <h2 style="color:#2D404E">
                    N'oubliez pas !
                    <br>
                    L'application est dispobible
                  </h2>
                   <img src="https://buddy.world/wp-content/uploads/2018/05/App-Store-Google-Play-Badges-Vector.jpg" alt="logo" height="50px">
                </th>
              </tr>
             </table>
            </div>`;
    return html;
};

exports.reservationRegister = function (title, start, end, price) {
    const html = `<div style="background-color: #49A69A">
                  <img src="https://www.zupimages.net/up/20/33/hu8k.png" alt="logo"height="30" style="padding-top: 15px; padding-bottom: 10px; padding-left: 20px">
                </div>
                <div style="background-color: #2D404E; padding-top: 15px; padding-bottom: 25px">
                 <table style="width:100%">
                   <tr>
                    <th>
                      <h1 style="color: #fff">Votre réservation est enregistré</h1>
                      <p style="color: #fff">
                      Votre réservation pour "${title}" a bien été enregistré.
                       <br> 
                       Du ${start} au ${end},
                       <br> 
                       pour ${price} € par nuit.
                      </p>
                      <a href="https://ebooking.glitch.me/rent" style="text-decoration: none">
                      <button style=" border: none;
                                      color: white;
                                      padding: 10px 15px;
                                      text-align: center;
                                      text-decoration: none;
                                      display: inline-block;
                                      font-size: 16px;
                                      margin: 4px 2px;
                                      cursor: pointer;
                                      background-color: #49A69A;
                                      border-radius: 50px;">
                        Vos réservations
                      </button>
                        </a>
                    </th>
                    <th>
                      <img src="https://www.zupimages.net/up/20/33/pfyd.png" alt="logo" height="150px">
                    </th>
                  </tr>
                 </table>
                </div>
                <div style="background-color: #FFFFFF; padding-top: 15px; padding-bottom: 10px">
                 <table style="width:100%">
                   <tr>
                    <th>
                      <img src="https://zupimages.net/up/20/33/asu3.jpg" alt="logo" height="200px">
                    </th>
                     <th>
                      <h2 style="color:#2D404E">
                        N'oubliez pas !
                        <br>
                        L'application est dispobible
                      </h2>
                       <img src="https://buddy.world/wp-content/uploads/2018/05/App-Store-Google-Play-Badges-Vector.jpg" alt="logo" height="50px">
                    </th>
                  </tr>
                 </table>
                </div>`;
    return html;
}

exports.reservationUpdate = function (title, start, end, price) {
    const html = `<div style="background-color: #49A69A">
                    <img src="https://www.zupimages.net/up/20/33/hu8k.png" alt="logo"height="30" style="padding-top: 15px; padding-bottom: 10px; padding-left: 20px">
                </div>
                <div style="background-color: #2D404E; padding-top: 15px; padding-bottom: 25px">
                    <table style="width:100%">
                        <tr>
                            <th>
                                <h1 style="color: #fff">Votre réservation est enregistré</h1>
                                <p style="color: #fff">
                                    Votre réservation pour "${title}" a été mise à jour.
                                    <br>
                                        Du ${start} au ${end},
                                        <br>
                                            pour ${price} € par nuit.
                                </p>
                                <a href="https://ebooking.glitch.me/rent" style="text-decoration: none">
                                    <button style=" border: none;
                                                      color: white;
                                                      padding: 10px 15px;
                                                      text-align: center;
                                                      text-decoration: none;
                                                      display: inline-block;
                                                      font-size: 16px;
                                                      margin: 4px 2px;
                                                      cursor: pointer;
                                                      background-color: #49A69A;
                                                      border-radius: 50px;">
                                        Vos réservations
                                    </button>
                                </a>
                            </th>
                            <th>
                                <img src="https://www.zupimages.net/up/20/33/pfyd.png" alt="logo" height="150px">
                            </th>
                        </tr>
                    </table>
                </div>
                <div style="background-color: #FFFFFF; padding-top: 15px; padding-bottom: 10px">
                    <table style="width:100%">
                        <tr>
                            <th>
                                <img src="https://zupimages.net/up/20/33/asu3.jpg" alt="logo" height="200px">
                            </th>
                            <th>
                                <h2 style="color:#2D404E">
                                    N'oubliez pas !
                                    <br>
                                        L'application est dispobible
                                </h2>
                                <img src="https://buddy.world/wp-content/uploads/2018/05/App-Store-Google-Play-Badges-Vector.jpg" alt="logo" height="50px">
                            </th>
                        </tr>
                    </table>
                </div>`;
    return html;
}

exports.passwordReset = function (otp) {
    const html = `<div style="background-color: #49A69A">
                    <img src="https://www.zupimages.net/up/20/33/hu8k.png" alt="logo"height="30" style="padding-top: 15px; padding-bottom: 10px; padding-left: 20px">
                </div>
                <div style="background-color: #2D404E; padding-top: 15px; padding-bottom: 25px">
                    <table style="width:100%">
                        <tr>
                            <th>
                                <h1 style="color: #fff">Votre mot de passe provisoire</h1>
                                <p style="color: #fff">
                                    Saisissez le mot de passe provisoire ci-dessous.
                                    <br>
                                    Pour plus de sécurité, modifiez-le dans le rubrique <strong>Mon Compte</strong>.
                                </p>
                                <p style="  border: none;
                                              color: #2D404E;
                                              padding: 10px 15px;
                                              text-align: center;
                                              display: inline-block;
                                              font-size: 16px;
                                              margin: 4px 2px;
                                              background-color: #fff;
                                              border-radius: 25px;">
                                    ${otp}
                                </p>
                            </th>
                            <th>
                                <img src="https://zupimages.net/up/20/33/xyuz.png" alt="logo" height="150px">
                            </th>
                        </tr>
                    </table>
                </div>
                <div style="background-color: #FFFFFF; padding-top: 15px; padding-bottom: 10px">
                    <table style="width:100%">
                        <tr>
                            <th>
                                <img src="https://zupimages.net/up/20/33/asu3.jpg" alt="logo" height="200px">
                            </th>
                            <th>
                                <h2 style="color:#2D404E">
                                    N'oubliez pas !
                                    <br>
                                        L'application est dispobible
                                </h2>
                                <img src="https://buddy.world/wp-content/uploads/2018/05/App-Store-Google-Play-Badges-Vector.jpg" alt="logo" height="50px">
                            </th>
                        </tr>
                    </table>
                </div>`;
    return html;
}
