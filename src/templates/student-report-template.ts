export const exportStudentReport = (examChart: any, planetChart: any) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml/DTD/xhtml1-transitional.dtd">
<html>

    <head>
        <meta http-equiv="Content-Type" content="text/html;charset=UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=7">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório Aluno</title>
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
                font-size: 13px;
                color: #4a4a4a;
            }
        </style>
    </head>

    <body>
        <center class="wrapper">
            <div class="webkit">
                <table class="outer" align="center" style="padding: 10px;">
                    <tr>
                        <td>
                            <table width="100%" style="border-spacing: 0;">
                                <tr>
                                    <td style="padding: 10px; text-align: center;">
                                        <a href="">
                                            <img style="height: 100px;"
                                                src="https://storage.googleapis.com/eduedu-escola/eduedu-preta.svg"
                                                alt="EduEdu Escola Logo">
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- DESEMPENHO DO ALUNO POR ARÉA -->
                    <tr>
                    
                        <table class="outer" align="center" style="padding: 10px;">
                            <tr>
                                <td colspan="3">
                                    <h2>Desempenho do Aluno por Área</h2>
                                </td>
                            </tr>
                            <tr>                            
                              {{#performanceByArea}}
                                <td>
                                    <p>
                                        {{{axisName}}}:
                                        <br>
                                        <span style="color: {{{color}}}">{{{description}}}</span>
                                    </p>
                                </td>
                              {{/performanceByArea}}
                            </tr>
                        </table>
                    </tr>

                    <!-- RELATÓRIO DO ALUNO -->
                    <tr>
                        <table class="outer" align="center" style="padding: 10px;">
                            <tr>
                                <td>
                                    <h2>Relatório do Aluno</h2>
                                </td>
                            </tr>

                            {{#summaries}}
                            <tr>
                              <td>{{{summary}}} <br><br></td>
                            </tr>
                            {{/summaries}}

                        </table>
                    </tr>

                    <!-- DESEMPENHO DO ALUNO POR PLANETA/PROVA -->
                    <tr>
                        <table class="outer" align="center" style="padding: 10px;">
                            <tr>
                                <td>
                                    <h2>Desempenho do Aluno por Provas</h2>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <canvas id="examsChart" width="400" height="200"></canvas>
                                </td>
                            </tr>
                        </table>
                    </tr>

                    <!-- DESEMPENHO DA TURMA POR PLANETA/PROVA -->
                    <tr>
                        <table class="outer" align="center" style="padding: 10px;">
                            <tr>
                                <td>
                                    <h2>Desempenho do Aluno por Planetas</h2>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <canvas id="planetChart" width="400" height="200"></canvas>
                                </td>
                            </tr>
                        </table>
                    </tr>

                    <!-- DESEMPENHO NOS PLANETAS DISPONIBILIZADOS APÓS A PROVA REALIZADA -->
                    <tr>
                        <table class="outer" style="padding: 10px;">
                            <thead style="background-color: #4a4a4a; color: #f6f9fc">
                                <tr>
                                    <th>Nome</th>
                                    <th>Planetas oferecidos</th>
                                    <th>Planetas Realizados</th>
                                    <th>Média Estrelas (Realizado)</th>
                                </tr>
                            </thead>
                            <tbody>
                             {{#planetsPerformance}}
                                <tr>
                                    <td>{{{axisName}}}</td>
                                    <td>{{{offeredPlanets}}}</td>
                                    <td>{{{accomplishedPlanets}}}</td>
                                    <td>{{{averageStars}}}</td>
                                </tr>
                             {{/planetsPerformance}}
                            </tbody>
                        </table>
                    </tr>

                    <tr>
                        <td style="padding-top: 50px;">
                            <p>
                                Atenciosamente,
                                <br>
                                Equipe EduEdu Escola
                            </p>
                        </td>
                    </tr>
                </table>
            </div>
        </center>


        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script>
            document.addEventListener('DOMContentLoaded', () => {
                const examChartData = ${JSON.stringify(examChart.data)};
                const ctx = document.getElementById('examsChart').getContext('2d');
                const examsChart = new Chart(ctx, {
                    type: 'line',
                    data: examChartData,
                    options: ${JSON.stringify(examChart.options)}
                });
            });
        </script>
        <script>
            document.addEventListener('DOMContentLoaded', () => {
                const planetChartData = ${JSON.stringify(planetChart.data)};
                const ctx = document.getElementById('planetChart').getContext('2d');
                const planetCharts = new Chart(ctx, {
                    type: 'line',
                    data: planetChartData,
                    options: ${JSON.stringify(planetChart.options)}
                });
            });
        </script>
        
        <script src="https://unpkg.com/mustache@latest"></script>
        <script src="render.js"></script>
    </body>

</html>
`;
