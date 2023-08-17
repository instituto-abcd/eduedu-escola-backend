export const passwordTemplate = (url: string, name: string) => `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml/DTD/xhtml1-transitional.dtd">
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html;charset=UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=7" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset de Senha</title>
    <style type="text/css">
      body {
        margin: 0;
        padding: 0;
        background-color: #f6f9fc;
      }

      table {
        border-spacing: 0;
      }

      td {
        padding: 0;
      }

      img {
        border: 0;
      }

      .wrapper {
        width: 100%;
        table-layout: fixed;
        background-color: #f6f9fc;
        padding-bottom: 40px;
      }

      .webkit {
        max-width: 600px;
        background-color: #ffffff;
      }

      .outer {
        margin: 0 auto;
        width: 100%;
        max-width: 600px;
        border-spacing: 0;
        font-family: sans-serif;
        color: #4a4a4a;
      }
    </style>
  </head>

  <body>
    <center class="wrapper">
      <div class="webkit">
        <table class="outer" align="center" style="padding: 10px">
          <tr>
            <td>
              <table width="100%" style="border-spacing: 0">
                <tr>
                  <td style="padding: 10px; text-align: center">
                    <a href="">
                      <img
                        style="height: 150px"
                        src="cid:logoeduedu"
                        alt="EduEdu Escola Logo"
                      />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td
              style="padding-top: 50px; font-size: 1.5rem; text-align: center"
            >
              Redefinição de senha
            </td>
          </tr>
          <tr>
            <td style="padding-top: 50px">
              ${name}, recebemos uma solicitação para redefinir a senha da sua
              conta EduEdu Escola.
              <br />
              Para redefinir sua senha, utilize o botão abaixo:
            </td>
          </tr>
          <tr>
            <td style="padding-top: 50px; text-align: center">
              <a href="${url}" >
                <button
                  style="
                    padding: 0.5rem 1.375rem;
                    background-color: #228be6;
                    border: none;
                    border-radius: 12px;
                    color: #fff;
                  "
                >
                  Reset de Senha
                </button>
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 50px">
              O botão não está funcionando para você?
              <br />
              Copie a URL para o seu navegador:
            </td>
          </tr>
          <tr>
            <td style="padding-top: 50px; max-width: 200px !important; overflow-wrap: anywhere;">${url}</td>
          </tr>

          <tr>
            <td style="padding-top: 50px">
              Atenciosamente,
              <br />
              Equipe EduEdu Escola
            </td>
          </tr>
        </table>
      </div>
    </center>
  </body>
</html>

`;
