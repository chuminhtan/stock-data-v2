const PROXY = 'https://stormy-retreat-00347.herokuapp.com/';
const LAST_YEAR = 2020;
const ONE_YEAR = 1;
const THREE_YEAR = 3;
const FIVE_YEAR = 5;


// STOCK CONTROLLER
const StockController = (() => {

    return {

        getData4m: async function (companyCode) {
            let sales = new Array();
            let profitLastYear = new Number();
            let profitsAfterTax = new Array(); // lợi nhuận sau thuế

            let EPS = new Array();
            let BVPS = new Array();
            let ROA = new Array();
            let ROE = new Array();

            let numberOfShare = new Array(); // Số lượng cổ phiếu

            let sortTermDebt = new Array(); // Nợ ngắn hạn
            let longTermDebt = new Array(); // Nợ dài hạn
            let longTermDebtLastYear = new Number(); // Nợ dài hạn năm gần nhất
            let capitalOfOwner = new Array(); // vốn chủ sở hữu
            let asset = new Array(); // tài sản
            let assetInvisible = new Array();// tài sản vô hình
            let debt = new Array(); // Nợ phải trả

            let cashFollow = new Array(); // Luân chuyển dòng tiền kinh doanh

            let effectiveness = new Array();
            let efficiency = new Array();
            let productivity = new Array();
            let ROIC = new Array();

            let countYear = 6;
            let fireantType1 = 1; // Kết quả kinh doanh
            let fireantType2 = 1; // Cân đối kế toán
            let fireantType3 = 3; //  lưu chuyern dòng tiền trực tiếp
            let fireantType4 = 4; // Luư chuyển dòng tiền gián tiếp

            // FOR CANSLIM
            let salesQuarter = new Array();
            let epsQuarter = new Array();

            // 0. Get company name = company address
            let company = await this.getDataCompanyInfo(companyCode);

            // 1. Sales + ProfitLastYear + profitsAfterTax + ROA + ROE + EPS + numberOfShare 
            // let data1 = await this.getDataSalesProfitsAfterTaxWithFireant(companyCode, fireantType2, countYear)
            let data1 = await this.getDataSalesProfitsAfterTaxWithFialda(companyCode)

            sales = data1['sales'];
            profitsAfterTax = data1['profitsAfterTax'];
            profitLastYear = data1['profitLastYear'];
            EPS = data1['EPSArr'];
            ROA = data1['ROAArr'];
            ROE = data1['ROEArr'];
            numberOfShare = data1['numberOfShare'];

            salesQuarter = data1['salesQuarter'];
            epsQuarter = data1['epsQuarter'];

            // 2. BVPS 
            let data2 = await this.getDataEpsBvpsRoaRoe(companyCode);

            BVPS = data2['BVPSArr'];

            // 3. Nợ ngắn hạn + Nợ dài hạn + Nợ dài hạn năm gần nhất + Vốn chủ sở hữu + Tài sản
            let data3 = await this.getDataAboutAsset(companyCode, fireantType1, countYear);
            sortTermDebt = data3['sortTermDebt'];
            longTermDebt = data3['longTermDebt'];
            longTermDebtLastYear = data3['longTermDebtLastYear'];
            capitalOfOwner = data3['capitalOfOwner'];
            asset = data3['asset'];
            assetInvisible = data3['assetInvisible'];
            debt = data3['debt'];

            // console.log('Nợ Ngắn Hạn', sortTermDebt);
            // console.log('Nợ Dài Hạn', longTermDebt);
            // console.log('Vốn Chủ Sở Hữu', capitalOfOwner);
            // console.log('Tài Sản', asset);

            let bv = new Number();
            if (!BVPS[4]) {
                bv = (asset[4].value - assetInvisible[4].value - debt[4].value) / numberOfShare[4].value;
                BVPS.push({
                    year: 2019,
                    value: bv.toFixed(2)
                })
            }

            if (!BVPS[5]) {
                bv = (asset[5].value - assetInvisible[5].value - debt[5].value) / numberOfShare[5].value;
                BVPS.push({
                    year: 2020,
                    value: bv.toFixed(2)
                })
            }


            // 4 Luân chuyển dòng tiền
            // Gián tiếp
            let data4 = await this.getDataCashFollowIndirect(companyCode, fireantType4, countYear);

            if (data4 == null) {
                // trực tiếp
                data4 = await this.getDataCashFollowDirect(companyCode, fireantType3, countYear);
            }

            cashFollow = data4["cashFollow"];

            // 5. Tinh Effectiveness + Efficiency + Productivity
            let size = 6;
            let year = new Number();

            for (let i = 0; i < asset.length; i++) {
                year = sales[i]['year'];

                effectiveness.push({
                    year,
                    value: (sales[i]['value'] / asset[i]['value']).toFixed(3)
                });

                efficiency.push({
                    year,
                    value: (profitsAfterTax[i]['value'] / sales[i]['value']).toFixed(3)
                });

                productivity.push({
                    year,
                    value: (cashFollow[i]['value'] / profitsAfterTax[i]['value']).toFixed(3)
                });

                ROIC.push({
                    year,
                    value: (profitsAfterTax[i]['value'] / (sortTermDebt[i]['value'] + longTermDebt[i]['value'] + capitalOfOwner[i]['value'])).toFixed(3)
                });
            }

            // return
            return {
                sales,
                profitsAfterTax,
                profitLastYear,
                EPS,
                BVPS,
                ROA,
                ROE,
                sortTermDebt,
                longTermDebt,
                longTermDebtLastYear,
                capitalOfOwner,
                asset,
                cashFollow,
                effectiveness,
                efficiency,
                productivity,
                ROIC,
                epsQuarter,
                salesQuarter,
                company
            }
        },

        getDataSalesProfitsAfterTaxWithFialda: async function (companyCode) {
            let url = `https://api4.fialda.com/api/services/app/TechnicalAnalysis/GetFinancialHighlights?symbol=${companyCode}`;
            console.log("Connect to Fialda...");
            let response = await fetch(`${PROXY}${url}`, {
                'method': 'GET'
            });

            const data = await response.json();
            let dataCanslim = new Array();
            let salesQuarter = new Array();
            let epsQuarter = new Array();

            // FOR CANSLIM
            dataCanslim = data["result"].filter((el) => (el['year'] >= 2019 && el['year'] <= 2021 && el['quarter'] !== 5 && el['quarter'] !== 0));
            dataCanslim.forEach(el => {
                salesQuarter.push({
                    year: el['year'],
                    quater: el['quarter'],
                    value: parseFloat((el['netSale'] / 1000000000).toFixed(2))
                })

                epsQuarter.push({
                    year: el['year'],
                    quater: el['quarter'],
                    value: parseFloat(el['eps'].toFixed(2))
                })
            })

            // FOR 4M
            let dataFilter = data["result"].filter((el) => (el['year'] >= 2015 && el['year'] <= 2020 && el['quarter'] === 5));
            let sales = new Array();
            let profitsAfterTax = new Array();
            let profitLastYear = new Number();
            let EPSArr = new Array();
            let ROAArr = new Array();
            let ROEArr = new Array();
            let numberOfShare = new Array();

            dataFilter.forEach((el) => {
                sales.push({
                    year: el['year'],
                    value: el['netSale']
                });

                profitsAfterTax.push({
                    year: el['year'],
                    value: el['profit']
                });

                EPSArr.push({
                    year: el['year'],
                    value: el['eps'].toFixed(3)
                });

                ROAArr.push({
                    year: el['year'],
                    value: el['mE_ROA'].toFixed(3)
                });

                ROEArr.push({
                    year: el['year'],
                    value: el['mE_ROE'].toFixed(3)
                });

                numberOfShare.push({
                    year: el['year'],
                    value: el['charterCapital'] / 10000
                })

                if (el['year'] === 2020) {
                    profitLastYear = el['profit']
                }

            });
            return {
                sales,
                profitsAfterTax,
                profitLastYear,
                EPSArr,
                ROAArr,
                ROEArr,
                numberOfShare,
                salesQuarter,
                epsQuarter
            }
        },

        getDataSalesProfitsAfterTaxWithFireant: async function (companyCode, fireantType, countYear) {

            let response = await fetch(`${PROXY}https://svr5.fireant.vn/api/Data/Finance/LastestFinancialReports?symbol=${companyCode}&type=${fireantType}&year=2021&quarter=0&count=6`, {
                'method': 'GET'
            });
            console.log("Connect to Fireant...");
            const data = await response.json();


            // Lọc Array lấy ra 2 phần tử
            // ID=3: Tổng doanh thu
            // ID=19: Tổng lợi nhuận sau thuế
            let dataFilter = new Array();
            let arrTemp = new Array();

            dataFilter.push(data[2]);

            let profits = new Array();
            profits = data.filter((el) => el['ID'] == 19);

            if (profits.length === 0) {

                dataFilter = [...dataFilter, ...data.filter((el) => el['ID'] === 13)];
            } else {
                dataFilter = [...dataFilter, ...profits]
            }

            // let dataFilter = data.filter((el) => el['ID'] == 3 || el['Name'] == 'Lợi nhuận sau thuế thu nhập doanh nghiệp');

            let fullSalesData = new Array();
            let sales = new Array();
            let profitsAfterTax = new Array();
            let profitLastYear = new Number();

            // dataFilter[0]['Values] chứa Array Tổng doanh thu
            fullSalesData = [...dataFilter[0]['Values']];
            fullSalesData.forEach((sale) => {
                sales.push({
                    year: sale['Year'],
                    value: sale['Value']
                })
            });

            // dataFilter[1]['Values] chứa Array Lợi Nhuận Sau Thuế
            let fullProfitsAfterTax = [...dataFilter[1]['Values']];
            fullProfitsAfterTax.forEach((profit) => {
                if (profit['Year'] === LAST_YEAR) {
                    profitLastYear = profit['Value'];
                }
                profitsAfterTax.push({
                    year: profit['Year'],
                    value: profit['Value']
                })
            });

            return {
                sales,
                profitsAfterTax,
                profitLastYear
            }
        },

        getDataEpsBvpsRoaRoe: async function (companyCode) {
            let response = await fetch(`${PROXY}https://e.cafef.vn/fi.ashx?symbol=${companyCode}`, {
                method: 'GET'
            });
            console.log("Connect to CafeF...");
            const data = await response.json();

            let dataFilter = data.filter((el) => el['Year'] >= 2015 && el['Year'] <= 2020);
            dataFilter = dataFilter.reverse();

            let BVPSArr = new Array();

            dataFilter.forEach((el) => {
                BVPSArr.push({
                    year: el['Year'],
                    value: (el['BV'] * 1000)
                });

            });

            return {
                BVPSArr
            }
        },

        getDataAboutAsset: async function (companyCode, fireantType, countYear) {
            let url = `https://svr5.fireant.vn/api/Data/Finance/LastestFinancialReports?symbol=${companyCode}&type=${fireantType}&year=2021&quarter=0&count=${countYear}`;
            let response = await fetch(`${PROXY}${url}`, {
                method: 'GET'
            });
            console.log("Connect to Fireant...");
            const data = await response.json();

            // Loc Array
            // ID = 2 : Tong cong tai san 
            // ID = 301 : Nợ phải trả
            // ID = 1020203 : Tài sản cố định vô hình
            // ID = 30101 : No ngan han
            // ID = 30102 : No dai han
            // ID = 30201 : Von chu so huu

            let dataFilter = data.filter((el) => el['ID'] === 30101 || el['ID'] === 30102 || el['ID'] === 30201 || el['ID'] === 2 || el['ID'] === 1020203 || el['ID'] === 301);

            // dataFilter[0] : tài sản cố định vô hình
            let asset = new Array(); // tài sản
            let assetInvisible = new Array(); // tài sản vô hình
            let sortTermDebt = new Array(); // Nợ ngắn hạn
            let longTermDebt = new Array(); // Nợ dài hạn
            let longTermDebtLastYear = new Number(); // Nợ dài hạn năm gần nhất
            let capitalOfOwner = new Array(); // vốn chủ sở hữu
            let arrayTemp = new Array();
            let debt = new Array();

            // Tài sản cố định vô hình
            arrayTemp = [...dataFilter[0]['Values']];
            arrayTemp.forEach((el) => {
                assetInvisible.push({
                    year: el['Year'],
                    value: el['Value']
                });
            })

            // Tổng Tai san
            arrayTemp = [...dataFilter[1]['Values']];
            arrayTemp.forEach((el) => {
                asset.push({
                    year: el['Year'],
                    value: el['Value']
                });
            })

            // Nợ phải trả
            arrayTemp = [...dataFilter[2]['Values']];
            arrayTemp.forEach((el) => {
                debt.push({
                    year: el['Year'],
                    value: el['Value']
                });
            })

            // No ngan han
            arrayTemp = [...dataFilter[3]['Values']];
            arrayTemp.forEach((el) => {
                sortTermDebt.push({
                    year: el['Year'],
                    value: el['Value']
                });
            })

            // No dai han
            arrayTemp = [...dataFilter[4]['Values']];
            arrayTemp.forEach((el) => {

                if (el['Year'] === 2020) {
                    longTermDebtLastYear = el['Value'];
                }

                longTermDebt.push({
                    year: el['Year'],
                    value: el['Value']
                });
            })

            // Von chu so huu
            arrayTemp = [...dataFilter[5]['Values']];
            arrayTemp.forEach((el) => {
                capitalOfOwner.push({
                    year: el['Year'],
                    value: el['Value']
                })
            })

            return {
                asset,
                assetInvisible,
                debt,
                sortTermDebt,
                longTermDebt,
                longTermDebtLastYear,
                capitalOfOwner
            }
        },

        getDataCashFollowIndirect: async function (companyCode, fireantType, countYear) {
            let url = `https://svr5.fireant.vn/api/Data/Finance/LastestFinancialReports?symbol=${companyCode}&type=${fireantType}&year=2021&quarter=0&count=${countYear}`;
            let response = await fetch(`${PROXY}${url}`, {
                method: 'GET'
            });

            const data = await response.json();

            if (data == null) {
                return null;
            }
            // Loc Array
            // ID = 104 : lưu chuyển tiền thuần từ hoạt động kinh doanh
            let dataFilter = data.filter((el) => el['ID'] === 104);
            let arrTemp = new Array();
            let cashFollow = new Array();

            arrTemp = [...dataFilter[0]['Values']];

            arrTemp.forEach((el) => {
                cashFollow.push({
                    year: el['Year'],
                    value: el['Value']
                });
            })


            return {
                cashFollow
            }
        },

        getDataCashFollowDirect: async function (companyCode, fireantType, countYear) {
            let url = `https://svr5.fireant.vn/api/Data/Finance/LastestFinancialReports?symbol=${companyCode}&type=${fireantType}&year=2021&quarter=0&count=${countYear}`;
            let response = await fetch(`${PROXY}${url}`, {
                method: 'GET'
            });

            const data = await response.json();

            // Loc Array
            // ID = 104 : lưu chuyển tiền thuần từ hoạt động kinh doanh
            let dataFilter = data.filter((el) => el['ID'] === 109);
            let arrTemp = new Array();
            let cashFollow = new Array();

            arrTemp = [...dataFilter[0]['Values']];

            arrTemp.forEach((el) => {
                cashFollow.push({
                    year: el['Year'],
                    value: el['Value']
                });
            })


            return {
                cashFollow
            }
        },

        getDataCompanyInfo: async function (companyCode) {
            let url = `https://svr6.fireant.vn/api/Data/Companies/CompanyInfo?symbol=${companyCode}`;

            let response = await fetch(`${PROXY}${url}`, {
                method: "GET"
            });

            const data = await response.json();
            return data;
        }
    }
})();


// UI CONTROLLER
const UIController = (() => {
    const DOMstrings = {
        formCompanyCode: "#form__company__code",
        inputCompanyCode: '#input__company__code',
        tbody4m: "#tbody__4m",
        companyName: '#company__name',
        companyAddress: '#company__address',
        companyWebsite: '#company__website',
        tbody4mRate: "#tbody__4m_2",
        tbodyCanslim: "#tbody__canslim"
    }

    // Tham chiếu
    let RefRate = {
        sales: 20,
        eps: 20,
        bvps: 15,
        cashFollow: 15,
        effectiveness: 10,
        efficiency: 10,
        productivity: 10,
        roa: 15,
        roe: 20,
        roic: 15
    }

    // Tỷ trọng
    let Proportion = {
        sales: 15,
        eps: 20,
        bvps: 5,
        cashFollow: 15,
        debtAndProfit: 10,
        effectiveness: 5 / 3,
        efficiency: 5 / 3,
        productivity: 5 / 3,
        roa: 10,
        roe: 5,
        roic: 15
    }

    // canslim
    let RefRow = {
        row1: 25,
        row2: 25,
        row3: 20,
        row4: 20
    }

    let ProRow = {
        row1: 15,
        row2: 10,
        row3: 10,
        row4: 5
    }

    // Chỉ số
    let Index = {
        oneYear: 30,
        threeYear: 30,
        fiveYear: 40
    }

    return {

        // CANSLIM
        renderCanslimTable: function (fullData) {
            const { epsQuarter, salesQuarter } = fullData;
            document.querySelector(DOMstrings.tbodyCanslim).innerHTML = "";

            let sale1, sale2, sale3, sale4, saleC1, saleC2, saleA1, saleA2;
            let eps1, eps2, eps3, eps4, epsC1, epsC2, epsA1, epsA2;

            // SALE 1
            sale1 = (salesQuarter[8].value / salesQuarter[4].value) - 1;
            sale1 = (sale1 * 100).toFixed(2)
            // SALE 2
            sale2 = (salesQuarter[7].value / salesQuarter[3].value) - 1;
            sale2 = (sale2 * 100).toFixed(2)
            // SALE 3
            let sumSale3Left = 0;
            let sumSale3Right = 0;
            for (let i = 1; i <= 4; i++) {
                sumSale3Left += salesQuarter[i].value;
            }

            for (let i = 5; i <= 8; i++) {
                sumSale3Right += salesQuarter[i].value;
            }

            sale3 = (sumSale3Right / sumSale3Left) - 1;
            sale3 = parseFloat((sale3 * 100).toFixed(2))

            // SALE 4
            let sumSale4Left = 0;
            let sumSale4Right = 0;
            for (let i = 0; i <= 3; i++) {
                sumSale4Left += salesQuarter[i].value;
            }

            for (let i = 4; i <= 7; i++) {
                sumSale4Right += salesQuarter[i].value;
            }
            sale4 = (sumSale4Right / sumSale4Left) - 1;
            sale4 = parseFloat((sale4 * 100).toFixed(2))

            // SALE C1
            saleC1 = this.calculateCanslimScore(sale1, RefRow.row1, ProRow.row1);
            // SALE C2
            saleC2 = this.calculateCanslimScore(sale2, RefRow.row2, ProRow.row2)
            // SALE A1
            saleA1 = this.calculateCanslimScore(sale3, RefRow.row3, ProRow.row3)
            // SALE A2
            saleA2 = this.calculateCanslimScore(sale4, RefRow.row4, ProRow.row4)

            // EPS 1
            eps1 = (epsQuarter[8].value / epsQuarter[4].value) - 1;
            eps1 = (eps1 * 100).toFixed(2)

            // EPS 2
            eps2 = (epsQuarter[7].value / epsQuarter[3].value) - 1;
            eps2 = (eps2 * 100).toFixed(2)

            // EPS 3
            let sumEps3Left = 0;
            let sumEps3Right = 0;
            for (let i = 1; i <= 4; i++) {
                sumEps3Left += epsQuarter[i].value;
            }

            for (let i = 5; i <= 8; i++) {
                sumEps3Right += epsQuarter[i].value;
            }

            eps3 = (sumEps3Right / sumEps3Left) - 1;
            eps3 = parseFloat((eps3 * 100).toFixed(2))

            // EPS 4
            let sumEps4Left = 0;
            let sumEps4Right = 0;
            for (let i = 0; i <= 3; i++) {
                sumEps4Left += epsQuarter[i].value;
            }

            for (let i = 4; i <= 7; i++) {
                sumEps4Right += epsQuarter[i].value;
            }

            eps4 = (sumEps4Right / sumEps4Left) - 1;
            eps4 = parseFloat((eps4 * 100).toFixed(2))

            // SALE C1
            epsC1 = this.calculateCanslimScore(eps1, RefRow.row1, ProRow.row1);

            // SALE C2
            epsC2 = this.calculateCanslimScore(eps2, RefRow.row2, ProRow.row2)

            // SALE A1
            epsA1 = this.calculateCanslimScore(eps3, RefRow.row3, ProRow.row3)

            // SALE A2
            epsA2 = this.calculateCanslimScore(eps4, RefRow.row4, ProRow.row4)

            // SUM C
            let sumC = parseFloat((saleC1 + saleC2 + epsC1 + epsC2).toFixed(2));
            let sumA = parseFloat((saleA1 + saleA2 + epsA1 + epsA2).toFixed(2));




            // CREATE TABLE
            let html = ` <tr>
            <td class="font-weight-bold text-center">Tiêu Chí Sales (Tỷ đồng)</td>
            <th scope="col" class="text-center">Q1 2019</th>
            <th scope="col" class="text-center">Q2 2019</th>
            <th scope="col" class="text-center">Q3 2019</th>
            <th scope="col" class="text-center">Q4 2019</th>
            <th scope="col" class="text-center">Q1 2020</th>
            <th scope="col" class="text-center">Q2 2020</th>
            <th scope="col" class="text-center">Q3 2020</th>
            <th scope="col" class="text-center">Q4 2020</th>
            <th scope="col" class="text-center">Q1 2021</th>
            <th scope="col" class="text-center"></th>
            <th scope="col" class="text-center">Tham Chiếu</th>
            <th scope="col" class="text-center">Tỷ Trọng</th>
            <th scope="col" class="text-center">C</th>
            <th scope="col" class="text-center">A</th>
            <th scope="col" class="text-center">Tổng</th>
        </tr>
        <tr>
            <th scope="row">1 Quý gần nhất (C)</th>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td>${salesQuarter[4].value}</td>
            <td></td>
            <td></td>
            <td></td>
            <td>${salesQuarter[8].value}</td>
            <td>${sale1}</td>
            <td>25%</td>
            <td>15%</td>
            <td>${saleC1}</td>
            <td>-</td>
            <td rowspan="10" class="font-weight-bold text-success">${sumC + sumA}</td>
        </tr>
        <tr>
            <th scope="row">1 Quý trước đó gần nhất (C)</th>
            <td></td>
            <td></td>
            <td></td>
            <td>${salesQuarter[3].value}</td>
            <td></td>
            <td></td>
            <td></td>
            <td>${salesQuarter[7].value}</td>
            <td></td>
            <td>${sale2}</td>
            <td>25%</td>
            <td>10%</td>
            <td>${saleC2}</td>
            <td>-</td>
        </tr>
        <tr>
            <th scope="row">Trailing 12 tháng gần nhất (A)</th>
            <td></td>
            %sale_q2_2019_q1_2021%
            <td>${sale3}</td>
            <td>20%</td>
            <td>10%</td>
            <td>-</td>
            <td>${saleA1}</td>
        </tr>
        <tr>
            <th scope="row">Trailing 12 tháng gần nhất trước đó(A)</th>
            %sale_q1_2019_q4_2020%
            <td></td>
            <td>${sale4}</td>
            <td>20%</td>
            <td>5%</td>
            <td>-</td>
            <td>${saleA2}</td>
        </tr>

        <tr>
            <th class="font-weight-bold text-center">Tiêu Chí EPS (Đồng)</th>
            <th scope="col" class="text-danger text-center"></th>
            <th scope="col" class="text-danger text-center"></th>
            <th scope="col" class="text-danger text-center"></th>
            <th scope="col" class="text-danger text-center"></th>
            <th scope="col" class="text-danger text-center"></th>
            <th scope="col" class="text-danger text-center"></th>
            <th scope="col" class="text-danger text-center"></th>
            <th scope="col" class="text-danger text-center"></th>
            <th scope="col" class="text-danger text-center"></th>
            <th scope="col" class="text-danger text-center"></th>
            <th scope="col" class="text-danger text-center"><th>
            <th scope="col" class="text-danger text-center"></th>
            <th scope="col" class="text-danger text-center"></th>
            <th scope="col" class="text-danger text-center"></th>
        </tr>
        <tr>
            <th scope="row">1 Quý gần nhất (C)</th>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td>${epsQuarter[4].value}</td>
            <td></td>
            <td></td>
            <td></td>
            <td>${epsQuarter[8].value}</td>
            <td>${eps1}</td>
            <td>25%</td>
            <td>15%</td>
            <td>${epsC1}</td>
            <td>-</td>
        </tr>
        <tr>
            <th scope="row">1 Quý trước đó gần nhất (C)</th>
            <td></td>
            <td></td>
            <td></td>
            <td>${epsQuarter[3].value}</td>
            <td></td>
            <td></td>
            <td></td>
            <td>${epsQuarter[7].value}</td>
            <td></td>
            <td>${eps2}</td>
            <td>25%</td>
            <td>10%</td>
            <td>${epsC2}</td>
            <td>-</td>
        </tr>
        <tr>
            <th scope="row">Trailing 12 tháng gần nhất (A)</th>
            <td></td>
            %eps_q2_2019_q1_2021%
            <td>${eps3}</td>
            <td>20%</td>
            <td>10%</td>
            <td>-</td>
            <td>${epsA1}</td>
        </tr>
        <tr>
            <th scope="row">Trailing 12 tháng gần nhất trước đó(A)</th>
            %eps_q1_2019_q4_2020%
            <td></td>
            <td>${eps4}</td>
            <td>20%</td>
            <td>5%</td>
            <td>-</td>
            <td>${epsA2}</td>
        </tr>
        <tr>
        <th scope="row"></th>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td>${sumC}</td>
        <td>${sumA}</td>
    </tr>
        `

            let sale_q2_2019_q1_2021 = this.createData(1, 8, salesQuarter);
            let sale_q1_2019_q4_2020 = this.createData(0, 7, salesQuarter);
            let eps_q2_2019_q1_2021 = this.createData(1, 8, epsQuarter);
            let eps_q1_2019_q4_2020 = this.createData(0, 7, epsQuarter);

            let newHtml = html.replace('%sale_q2_2019_q1_2021%', sale_q2_2019_q1_2021);
            newHtml = newHtml.replace('%sale_q1_2019_q4_2020%', sale_q1_2019_q4_2020);
            newHtml = newHtml.replace('%eps_q2_2019_q1_2021%', eps_q2_2019_q1_2021);
            newHtml = newHtml.replace('%eps_q1_2019_q4_2020%', eps_q1_2019_q4_2020);

            document.querySelector(DOMstrings.tbodyCanslim).insertAdjacentHTML('beforeend', newHtml);
        },

        // ARRAY: Q2_2019 - Q1-2021
        createData: function (start, end, arr) {
            let data = "";
            for (let i = start; i <= end; i++) {
                data += `<td>${arr[i].value}</td>`
            }

            return data;
        },

        calculateCanslimScore: function (value, refRow, proRow) {
            let score = 0;
            if (value >= refRow) {
                score = proRow;
            } else if (value >= 0 && value < refRow) {
                score = value / refRow * proRow;
            }
            return score;
        },

        getDOMsString: function () {
            return DOMstrings;
        },

        getCompanyCodeFromInput: function () {
            const compCode = document.querySelector(DOMstrings.inputCompanyCode).value;

            if (compCode.length > 4) {
                return null;
            }

            return compCode;
        },

        // 4M TABLE
        renderTable4m: function (fullData) {
            document.querySelector(DOMstrings.tbody4m).innerHTML = "";
            let html = `<tr>
            <th scope="row">Sales (đồng)</th>
            %td_sales%
            
        </tr>
        <tr>
            <th scope="row">EPS (đồng)</th>
            %td_eps%
            
        </tr>
        <tr>
            <th scope="row">BVPS (đồng)</th>
            %td_bvps%
            
        </tr>
        <tr>
            <th scope="row">Lưu chuyển tiền thuần (đồng)</th>
            %td_cashFollow%
            
        </tr>
        <tr>
            <th scope="row">Nợ dài hạn năm gần nhất (đồng)</th>
            <td>%td_lastLongTermDebt%</td>
            <td class="font-weight-bold text-center" colspan="4">Lợi nhuận năm gần nhất (đồng)</td>
            <td>%td_lastProfit%</td>
            
        </tr>
        <tr>
            <th scope="row">Effectiveness</th>
            %td_effectiveness%
        </tr>
        <tr>
            <th scope="row">Efficiency</th>
            %td_efficiency%
        </tr>
        <tr>
            <th scope="row">Productivity</th>
            %td_productivity%
        </tr>
        <tr>
            <th scope="row">ROA</th>
            %td_roa%
        </tr>
        <tr>
            <th scope="row">ROE</th>
            %td_roe%
        </tr>
        <tr>
            <th scope="row">ROIC</th>
            %td_roic%
        </tr>`;

            const {
                sales,
                profitLastYear,
                EPS,
                BVPS,
                ROA,
                ROE,
                longTermDebtLastYear,
                cashFollow,
                effectiveness,
                efficiency,
                productivity,
                ROIC,
            } = fullData;

            let tdSales = '';
            let tdEPS = '';
            let tdBVPS = '';
            let tdCashFollow = '';
            let tdEffectiveness = '';
            let tdEfficiency = '';
            let tdProductivity = '';
            let tdROA = '';
            let tdROE = '';
            let tdROIC = '';

            let size = 6;
            for (let i = 0; i < size; i++) {
                tdSales += `<td>${this.numberWithSpaces(sales[i]['value'])}</td>`;
                (EPS[i] == undefined) ? tdEPS += `<td>-</td>` : tdEPS += `<td>${EPS[i]['value']}</td>`;
                (BVPS[i] == undefined) ? tdBVPS += `<td>-</td>` : tdBVPS += `<td>${BVPS[i]['value']}</td>`;
                (ROA[i] == undefined) ? tdROA += `<td>-</td>` : tdROA += `<td>${ROA[i]['value']}</td>`;
                (ROE[i] == undefined) ? tdROE += `<td>-</td>` : tdROE += `<td>${ROE[i]['value']}</td>`;
                (cashFollow[i] == undefined) ? tdCashFollow += `<td>-</td>` : tdCashFollow += `<td>${this.numberWithSpaces(cashFollow[i]['value'])}</td>`;
                (effectiveness[i] == undefined) ? tdEffectiveness += `<td>-</td>` : tdEffectiveness += `<td>${effectiveness[i]['value']}</td>`;
                (efficiency[i] == undefined) ? tdEfficiency += `<td>-</td>` : tdEfficiency += `<td>${efficiency[i]['value']}</td>`;
                (productivity[i] == undefined) ? tdProductivity += `<td>-</td>` : tdProductivity += `<td>${productivity[i]['value']}</td>`;
                (ROIC[i] == undefined) ? tdROIC += `<td></td>` : tdROIC += `<td>${ROIC[i]['value']}</td>`;
            }


            let newHtml = html.replace('%td_sales%', tdSales);
            newHtml = newHtml.replace('%td_eps%', tdEPS);
            newHtml = newHtml.replace('%td_bvps%', tdBVPS);
            newHtml = newHtml.replace('%td_cashFollow%', tdCashFollow);
            newHtml = newHtml.replace('%td_effectiveness%', tdEffectiveness);
            newHtml = newHtml.replace('%td_efficiency%', tdEfficiency);
            newHtml = newHtml.replace('%td_productivity%', tdProductivity);
            newHtml = newHtml.replace('%td_roa%', tdROA);
            newHtml = newHtml.replace('%td_roe%', tdROE);
            newHtml = newHtml.replace('%td_roic%', tdROIC);
            newHtml = newHtml.replace('%td_lastLongTermDebt%', this.numberWithSpaces(longTermDebtLastYear));
            newHtml = newHtml.replace('%td_lastProfit%', this.numberWithSpaces(profitLastYear));

            document.querySelector(DOMstrings.tbody4m).insertAdjacentHTML('beforeend', newHtml);

        },

        // 4M RATE TABLE
        render4mRate: function (fullData) {
            document.querySelector(DOMstrings.tbody4mRate).innerHTML = "";
            const {
                sales,
                profitLastYear,
                EPS,
                BVPS,
                ROA,
                ROE,
                longTermDebtLastYear,
                cashFollow,
                effectiveness,
                efficiency,
                productivity,
                ROIC,
                companyName,
                companyAddress,
                companyWebsite
            } = fullData;

            let salesScore;
            let epsScore;
            let bvpsScore;
            let cashFollowScore;
            let effectivenessScore;
            let effeciencyScore;
            let productivityScore;
            let roaScore;
            let roeScore;
            let roicScore;
            let debtAndProfitScore;

            salesScore = this.calculateRate(sales, RefRate.sales, Proportion.sales, "Sales Score");
            epsScore = this.calculateRate(EPS, RefRate.eps, Proportion.eps, "EPS Score");
            bvpsScore = this.calculateRate(BVPS, RefRate.bvps, Proportion.bvps, "BVPS Score");
            cashFollowScore = this.calculateRate(cashFollow, RefRate.cashFollow, Proportion.cashFollow, "LCDT từ HĐKD");
            effectivenessScore = this.calculateRate(effectiveness, RefRate.effectiveness, Proportion.effectiveness, "Effectiveness Score");
            efficiencyScore = this.calculateRate(efficiency, RefRate.efficiency, Proportion.efficiency, "Effeciency Score");
            productivityScore = this.calculateRate(productivity, RefRate.productivity, Proportion.productivity, "Productivity");
            roaScore = this.calculateRate(ROA, RefRate.roa, Proportion.roa, "ROA Score");
            roeScore = this.calculateRate(ROE, RefRate.roe, Proportion.roe, "ROE Score");
            roicScore = this.calculateRate(ROIC, RefRate.roic, Proportion.roic, "ROIC Score");
            debtAndProfitScore = this.calculateRate2(longTermDebtLastYear, profitLastYear, Proportion.debtAndProfit);

            let html = `
        <tr>
            <th scope="row">Sales</th>
            %td_sales%
            <td>20%</td>
            <td>15%</td>
            <td>%td_sales_score%</td>
            <td rowspan="11" class="font-weight-bold text-center text-success">%td_sum_score%</td>
        </tr>
        <tr>
            <th scope="row">EPS</th>
            %td_eps%    
            <td>20%</td>
            <td>20%</td>
            <td>%td_eps_score%</td>
        </tr>
        <tr>
            <th scope="row">BVPS</th>
            %td_bvps%
            <td>15%</td>
            <td>5%</td>
            <td>%td_bvps_score%</td>
        </tr>
        <tr>
            <th scope="row">Tăng Trưởng OPC LCDTKD</th>
            %td_cashFollow%
            <td>15%</td>
            <td>15%</td>
            <td>%td_cashFollow_score%</td>
        </tr>
        <tr>
            <th scope="row">Nợ dài hạn năm gần nhất</th>
            <td>%td_lastLongTermDebt%</td>
            <td class="font-weight-bold">Lợi nhuận năm gần nhất</td>
            <td>%td_lastProfit%</td>
            <td>3*LN</td>
            <td>10%</td>
            <td>%td_debt_and_profit_score%</td>
        </tr>
        <tr>
            <th scope="row">Effectiveness</th>
            %td_effectiveness%
            <td>10%</td>
            <td rowspan="3">5%</td>
            <td>%td_effectiveness_score%</td>
        </tr>
        <tr>
            <th scope="row">Effciency</th>
            %td_efficiency%           
            <td>10%</td>

            <td>%td_efficiency_score%</td>
        </tr>
        <tr>
            <th scope="row">Productitivty</th>
            %td_productivity%            
            <td>10%</td>

            <td>%td_productivity_score%</td>
        </tr>
        <tr>
            <th scope="row">ROA</th>
            %td_roa%            
            <td>15%</td>
            <td>10%</td>
            <td>%td_roa_score%</td>
        </tr>
        <tr>
            <th scope="row">ROE</th>
            %td_roe%
            <td>20%</td>
            <td>5%</td>
            <td>%td_roe_score%</td>

        </tr>
        <tr>
            <th scope="row">ROIC</th>
            %td_roic%            
            <td>15%</td>
            <td>15%</td>
            <td>%td_roic_score%</td>
        </tr>`

            let tdSales = '';
            let tdEPS = '';
            let tdBVPS = '';
            let tdCashFollow = '';
            let tdEffectiveness = '';
            let tdEfficiency = '';
            let tdProductivity = '';
            let tdROA = '';
            let tdROE = '';
            let tdROIC = '';
            let sumScore = 0;

            let size = 3;
            for (let i = 0; i < size; i++) {
                tdSales += `<td>${salesScore.resultArray[i]}</td>`;
                tdEPS += `<td>${epsScore.resultArray[i]}</td>`;
                tdBVPS += `<td>${bvpsScore.resultArray[i]}</td>`;
                tdCashFollow += `<td>${cashFollowScore.resultArray[i]}</td>`;
                tdEffectiveness += `<td>${effectivenessScore.resultArray[i]}</td>`;
                tdEfficiency += `<td>${efficiencyScore.resultArray[i]}</td>`;
                tdProductivity += `<td>${productivityScore.resultArray[i]}</td>`;
                tdROA += `<td>${roaScore.resultArray[i]}</td>`;
                tdROE += `<td>${roeScore.resultArray[i]}</td>`;
                tdROIC += `<td>${roicScore.resultArray[i]}</td>`;

            }

            sumScore += salesScore.score
                + epsScore.score
                + bvpsScore.score
                + cashFollowScore.score
                + effectivenessScore.score
                + efficiencyScore.score
                + productivityScore.score
                + roaScore.score + roeScore.score
                + roicScore.score
                + debtAndProfitScore.score;

            let newHtml = html.replace('%td_sales%', tdSales);
            newHtml = newHtml.replace('%td_eps%', tdEPS);
            newHtml = newHtml.replace('%td_bvps%', tdBVPS);
            newHtml = newHtml.replace('%td_cashFollow%', tdCashFollow);
            newHtml = newHtml.replace('%td_effectiveness%', tdEffectiveness);
            newHtml = newHtml.replace('%td_efficiency%', tdEfficiency);
            newHtml = newHtml.replace('%td_productivity%', tdProductivity);
            newHtml = newHtml.replace('%td_roa%', tdROA);
            newHtml = newHtml.replace('%td_roe%', tdROE);
            newHtml = newHtml.replace('%td_roic%', tdROIC);
            newHtml = newHtml.replace('%td_lastLongTermDebt%', this.numberWithSpaces(longTermDebtLastYear));
            newHtml = newHtml.replace('%td_lastProfit%', this.numberWithSpaces(profitLastYear));

            // score
            newHtml = newHtml.replace('%td_sales_score%', salesScore.sum);
            newHtml = newHtml.replace('%td_eps_score%', epsScore.sum);
            newHtml = newHtml.replace('%td_bvps_score%', bvpsScore.sum);
            newHtml = newHtml.replace('%td_cashFollow_score%', cashFollowScore.sum);
            newHtml = newHtml.replace('%td_effectiveness_score%', effectivenessScore.sum);
            newHtml = newHtml.replace('%td_efficiency_score%', efficiencyScore.sum);
            newHtml = newHtml.replace('%td_productivity_score%', productivityScore.sum);
            newHtml = newHtml.replace('%td_roa_score%', roaScore.sum);
            newHtml = newHtml.replace('%td_roe_score%', roeScore.sum);
            newHtml = newHtml.replace('%td_roic_score%', roicScore.sum);
            newHtml = newHtml.replace('%td_debt_and_profit_score%', debtAndProfitScore.sum);
            newHtml = newHtml.replace('%td_sum_score%', sumScore.toFixed(1));
            document.querySelector(DOMstrings.tbody4mRate).insertAdjacentHTML('beforeend', newHtml);

        },

        calculateRate2: function (dept, profit, proportion) {
            let score = 0;
            let sum = 0;
            if (dept < (profit * 3)) {
                sum = 100;
                score = sum * proportion / 100;
            } else {
                sum = 0;
                score = 0;
            }

            return {
                sum,
                score
            }
        },

        calculateRate: function (data, refRate, proportion, name) {
            if (!data[5]) {
                return 0;
            }
            let resultArray = new Array();
            let oneYearResult = 0;
            let threeYearResult = 0;
            let fiveYearResult = 0;

            // 1 YEAR - Rate 2020 - 2019
            let oneYearRate = (Math.pow(data[5].value / data[4].value, 1 / ONE_YEAR) - 1) * 100;

            if (isNaN(oneYearRate)) {
                oneYearResult = 0;
            } else {
                oneYearRate = Math.round(oneYearRate);
                if (oneYearRate >= refRate) {
                    oneYearResult = Index.oneYear;
                } else if (oneYearRate < 0) {
                    oneYearResult = 0;

                } else {
                    oneYearResult = oneYearRate / refRate * Index.oneYear;
                }
            }

            // 3 YEAR - Rate 2020 - 2017
            let threeYearRate = (Math.pow(data[5].value / data[2].value, 1 / THREE_YEAR) - 1) * 100;

            if (isNaN(threeYearRate)) {
                threeYearResult = 0

            } else {
                threeYearRate = Math.round(threeYearRate);

                if (threeYearRate >= refRate) {
                    threeYearResult = Index.threeYear;
                } else if (threeYearRate < 0) {
                    threeYearResult = 0;
                } else {
                    threeYearResult = threeYearRate / refRate * Index.threeYear;
                }

            }

            // 5 YEAR - Rate 2020 - 2015
            let fiveYearRate = (Math.pow(data[5].value / data[0].value, 1 / FIVE_YEAR) - 1) * 100;

            if (isNaN(fiveYearRate)) {
                fiveYearResult = 0;
            } else {
                fiveYearRate = Math.round(fiveYearRate);
                if (fiveYearRate >= refRate) {
                    fiveYearResult = Index.fiveYear;
                } else if (fiveYearRate < 0) {
                    fiveYearResult = 0;
                } else {
                    fiveYearResult = fiveYearRate / refRate * Index.fiveYear;
                }
            }


            let sum = oneYearResult + threeYearResult + fiveYearResult;

            let score = proportion * sum / 100;

            sum = sum.toFixed(1);
            resultArray.push(oneYearRate, threeYearRate, fiveYearRate);

            return {
                resultArray,
                sum,
                score
            }
        },

        numberWithSpaces: function (x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        },

        fNumberWithSpaces: function (x) {
            var parts = x.toString().split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
            return parts.join(".");
        },

        renderInfo: function (fullData) {
            const { company } = fullData;
            document.querySelector('#symbol').innerHTML = company.Symbol;
            document.querySelector('#company__name').innerHTML = company.CompanyName;
            document.querySelector('#email').innerHTML = company.Email;
            document.querySelector('#exchange').innerHTML = company.Exchange;
            document.querySelector('#fax').innerHTML = company.Fax;
            document.querySelector('#phone').innerHTML = company.Phone;
            document.querySelector('#overview').innerHTML = company.Overview;

        }
    }
})();

// APP CONTROLLER
const AppController = ((stockCtrl, UICtrl) => {
    const DOMs = UICtrl.getDOMsString();

    const setupEventListeners = () => {
        document.querySelector(DOMs.formCompanyCode).addEventListener('submit', calculate4m);
    }

    // CALCULATE 4M Value
    const calculate4m = async (event) => {
        event.preventDefault();

        const companyCode = UICtrl.getCompanyCodeFromInput();

        if (companyCode === null) {
            alert('Mã công ty không hợp lệ');
            return;
        }
        alert("Vui lòng chờ... Nhân OK để bắt đầu")
        const fullData = await stockCtrl.getData4m(companyCode);
        if (!fullData) {
            alert("Lỗi");
        }
        UICtrl.renderInfo(fullData)
        UICtrl.renderTable4m(fullData)
        UICtrl.render4mRate(fullData);
        UICtrl.renderCanslimTable(fullData);
        alert("Hoàn Thành")
    }

    return {
        init: function () {
            setupEventListeners();
        }
    }
})(StockController, UIController);

AppController.init();
