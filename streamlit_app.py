import streamlit as st
import pandas as pd
import numpy as np
from plotly.subplots import make_subplots
import plotly.graph_objects as go

st.set_page_config(page_title="散布図と回帰直線＋箱ひげ図", layout="wide")

st.title("散布図と回帰直線＋箱ひげ図")
st.caption("Created by 技術評論社")
st.write("ExcelまたはCSVファイルをアップロードしてください。")
st.write("2つの変数の散布図を作成し、回帰直線を引き、マージナル箱ひげ図を表示します。")
st.write("")

# ファイルアップローダー
uploaded_file = st.file_uploader(
    "ファイルをアップロードしてください (Excel or CSV)",
    type=['xlsx', 'csv']
)
use_demo_data = st.checkbox('デモデータを使用')

if use_demo_data:
    try:
        df = pd.read_excel('scatter_reg.xlsx')
        st.write("デモデータの先頭5行を表示:")
        st.write(df.head())
    except FileNotFoundError:
        st.error("デモデータファイル 'scatter_reg.xlsx' が見つかりません。")
elif uploaded_file is not None:
    try:
        if uploaded_file.type == 'text/csv':
            df = pd.read_csv(uploaded_file)
        else:
            df = pd.read_excel(uploaded_file)
        st.write("アップロードデータの先頭5行を表示:")
        st.write(df.head())
    except Exception as e:
        st.error(f"ファイル読み込み中にエラー: {e}")
else:
    df = None
    st.info("ファイルをアップロードするか、デモデータを使用してください。")

if df is not None:
    numerical_cols = df.select_dtypes(include=['number']).columns.tolist()
    if len(numerical_cols) < 2:
        st.warning("数値変数が2つ以上必要です。")
    else:
        st.subheader("変数の選択")
        col1, col2 = st.columns(2)
        with col1:
            x_var = st.selectbox('X軸の変数を選択', numerical_cols, index=0)
        with col2:
            y_var = st.selectbox('Y軸の変数を選択', numerical_cols, index=1)

        if x_var == y_var:
            st.warning("X軸とY軸には異なる変数を選択してください。")
        else:
            data = df[[x_var, y_var]].dropna()
            if data.empty:
                st.error("欠損値処理後、描画できるデータがありません。")
            else:
                x = data[x_var]
                y = data[y_var]

                # 回帰直線の計算
                slope, intercept = np.polyfit(x, y, 1)
                line = slope * x + intercept

                # 相関係数の計算
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

                # ─── マージナル箱ひげ図付きサブプロット ───
                fig = make_subplots(
                    rows=2, cols=2,
                    row_heights=[0.75, 0.25],       # 下段を小さく
                    column_widths=[0.35, 0.65],     # 左列を広げて間隔を確保
                    specs=[
                        [{"type":"box"},   {"type":"scatter"}],
                        [None,             {"type":"box"}]
                    ],
                    horizontal_spacing=0.02,
                    vertical_spacing=0.15          # 上下間隔を広げる
                )

                # 左上：Y軸箱ひげ図
                fig.add_trace(
                    go.Box(y=y, boxpoints=False, orientation='v',
                           name=f'{y_var} の分布'),
                    row=1, col=1
                )
                # 右上：散布図 + 回帰直線
                fig.add_trace(
                    go.Scatter(x=x, y=y, mode='markers', name='データ点'),
                    row=1, col=2
                )
                fig.add_trace(
                    go.Scatter(x=x, y=line, mode='lines', name='回帰直線'),
                    row=1, col=2
                )
                # 右下：X軸箱ひげ図
                fig.add_trace(
                    go.Box(x=x, boxpoints=False, orientation='h',
                           name=f'{x_var} の分布'),
                    row=2, col=2
                )

                # ─── marginal 箱ひげ図の軸を完全消去 ───
                for (r, c) in [(1,1), (2,2)]:
                    fig.update_xaxes(
                        showticklabels=False, showgrid=False,
                        zeroline=False, showline=False,
                        row=r, col=c
                    )
                    fig.update_yaxes(
                        showticklabels=False, showgrid=False,
                        zeroline=False, showline=False,
                        row=r, col=c
                    )
                # 左上のY箱ひげ図のタイトルも消去
                fig.update_yaxes(title_text='', row=1, col=1)

                # ─── 散布図側の軸タイトルを離す ───
                fig.update_xaxes(
                    title=x_var, title_standoff=40,
                    row=1, col=2
                )
                fig.update_yaxes(
                    title=y_var, title_standoff=80,
                    row=1, col=2
                )

                # ─── レイアウト調整 ───
                fig.update_layout(
                    height=650, width=900,
                    margin=dict(l=200, r=40, t=80, b=120),
                    title_text=f"{y_var} vs {x_var} （マージナル箱ひげ図付き）"
                )

                st.plotly_chart(fig, use_container_width=True)

                # 回帰式と相関係数
                st.subheader(f"回帰式: y = {slope:.2f}x + {intercept:.2f}")
                st.write(f"相関係数: {corr:.2f} （{corr_desc}）")
