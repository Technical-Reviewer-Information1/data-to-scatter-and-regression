import streamlit as st
import pandas as pd
import numpy as np
from plotly.subplots import make_subplots
import plotly.graph_objects as go

st.set_page_config(page_title="散布図と回帰直線", layout="wide")

st.title("散布図と回帰直線")
st.caption("Created by 技術評論社")
st.write("ExcelまたはCSVファイルをアップロードしてください。")
st.write("2つの変数の散布図を作成し、回帰直線を引き、マージナル箱ひげ図を表示します。")
st.write("")

uploaded_file = st.file_uploader(
    "ファイルをアップロードしてください (Excel or CSV)",
    type=['xlsx', 'csv']
)
use_demo_data = st.checkbox('デモデータを使用')

if use_demo_data:
    try:
        df = pd.read_excel('scatter_reg.xlsx')
        st.write(df.head())
    except FileNotFoundError:
        st.error("デモデータ 'scatter_reg.xlsx' が見つかりません。")
elif uploaded_file is not None:
    try:
        if uploaded_file.type == 'text/csv':
            df = pd.read_csv(uploaded_file)
        else:
            df = pd.read_excel(uploaded_file)
        st.write(df.head())
    except Exception as e:
        st.error(f"読み込みエラー: {e}")
else:
    df = None
    st.info("ファイルをアップロードしてください。")

if df is not None:
    cols = df.select_dtypes(include='number').columns.tolist()
    if len(cols) < 2:
        st.warning("数値列が2つ以上必要です。")
    else:
        st.subheader("変数を選択")
        c1, c2 = st.columns(2)
        with c1:
            x_var = st.selectbox("X軸", cols, index=0)
        with c2:
            y_var = st.selectbox("Y軸", cols, index=1)

        if x_var == y_var:
            st.warning("異なる変数を選択してください。")
        else:
            data = df[[x_var, y_var]].dropna()
            if data.empty:
                st.error("有効データがありません。")
            else:
                x = data[x_var]
                y = data[y_var]

                # 回帰直線
                slope, intercept = np.polyfit(x, y, 1)
                line = slope * x + intercept

                # 相関
                corr = x.corr(y)
                abs_r = abs(corr)
                if abs_r >= 0.9:
                    strength = "非常に強い"
                elif abs_r >= 0.7:
                    strength = "強い"
                elif abs_r >= 0.4:
                    strength = "中程度の"
                elif abs_r >= 0.2:
                    strength = "弱い"
                else:
                    strength = "ほとんど相関がない"
                corr_desc = (f"{strength}{'正の' if corr>0 else '負の'}相関"
                             if abs_r>=0.2 else strength)

                # サブプロット
                fig = make_subplots(
                    rows=2, cols=2,
                    row_heights=[0.8, 0.2],
                    column_widths=[0.1, 0.9],  # ← 左を15%、右を85%
                    specs=[
                        [{"type":"box"}, {"type":"scatter"}],
                        [None,             {"type":"box"}]
                    ],
                    horizontal_spacing=0.02,
                    vertical_spacing=0.15
                )

                # Y箱ひげ図（左上）
                fig.add_trace(
                    go.Box(y=y, boxpoints=False, orientation='v',
                           showlegend=False),
                    row=1, col=1
                )
                # 散布図 + 回帰直線（右上）
                fig.add_trace(
                    go.Scatter(x=x, y=y, mode='markers', name='データ点'),
                    row=1, col=2
                )
                fig.add_trace(
                    go.Scatter(x=x, y=line, mode='lines', name='回帰直線'),
                    row=1, col=2
                )
                # X箱ひげ図（右下）
                fig.add_trace(
                    go.Box(x=x, boxpoints=False, orientation='h',
                           showlegend=False),
                    row=2, col=2
                )

                # marginal 箱ひげ図 の目盛・線を消去
                for (r, c) in [(1,1), (2,2)]:
                    fig.update_xaxes(showticklabels=False, showgrid=False,
                                     zeroline=False, showline=False,
                                     row=r, col=c)
                    fig.update_yaxes(showticklabels=False, showgrid=False,
                                     zeroline=False, showline=False,
                                     row=r, col=c)

                # 散布図側の軸タイトルを離す
                fig.update_xaxes(title=x_var, title_standoff=20,
                                 row=2, col=2)
                fig.update_yaxes(title=y_var, title_standoff=120,
                                 row=1, col=2)

                # レイアウト調整
                fig.update_layout(
                    height=650,
                    width=900,
                    margin=dict(l=80, r=40, t=80, b=120),
                    title_text=f"{y_var} と {x_var} の関係"
                )
                
                # X軸（下段）の整数表示
                fig.update_xaxes(tickformat=',.0f')
                # Y軸（上段）の整数表示
                fig.update_yaxes(tickformat=',.0f')

                st.plotly_chart(fig, use_container_width=True)

                st.subheader(f'回帰式： y = {slope:.2f}x + {intercept:.2f}')
                st.write(f'{y_var} = {slope:.2f} × {x_var} + {intercept:.2f}')
                st.subheader(f'相関係数： {corr:.2f}')
                st.write(f"「{y_var}」 と 「{x_var}」 の間には、{corr_desc}があります。（r = {corr:.2f}）")
