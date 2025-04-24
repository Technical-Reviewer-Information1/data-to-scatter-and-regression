import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import numpy as np

st.set_page_config(page_title="散布図と回帰直線", layout="wide")

st.title("散布図と回帰直線")
st.caption("Created by Dit-Lab.(Daiki Ito)")
st.write("ExcelまたはCSVファイルをアップロードしてください。2つの変数の散布図を作成し、回帰直線を引き、\( y = ax + b \) の式を表示します。")
st.write("相関係数も表示されます。")
st.write("")

# ファイルアップローダー
uploaded_file = st.file_uploader('ファイルをアップロードしてください (Excel or CSV)', type=['xlsx', 'csv'])

# デモデータを使うかどうかのチェックボックス
use_demo_data = st.checkbox('デモデータを使用')

if use_demo_data:
    # デモデータを読み込む
    try:
        df = pd.read_excel('scatter_reg.xlsx')
        st.write("デモデータの先頭5行を表示します:")
        st.write(df.head())
    except FileNotFoundError:
        st.error("デモデータファイル 'scatter_reg.xlsx' が見つかりません。ファイルが存在することを確認してください。")
elif uploaded_file is not None:
    if uploaded_file.type == 'text/csv':
        try:
            df = pd.read_csv(uploaded_file)
            st.write("データの先頭5行を表示します:")
            st.write(df.head())
        except Exception as e:
            st.error(f"CSVファイルの読み込み中にエラーが発生しました: {e}")
    else:
        try:
            df = pd.read_excel(uploaded_file)
            st.write("データの先頭5行を表示します:")
            st.write(df.head())
        except Exception as e:
            st.error(f"Excelファイルの読み込み中にエラーが発生しました: {e}")
else:
    df = None
    st.info("ファイルをアップロードするか、デモデータを使用してください。")

if df is not None:
    # 数値変数の抽出
    numerical_cols = df.select_dtypes(include=['number']).columns.tolist()

    if len(numerical_cols) >= 2:
        st.subheader('散布図の作成')

        # 数値変数の選択
        col1, col2 = st.columns(2)
        with col1:
            x_var = st.selectbox('X軸の変数を選択してください:', numerical_cols, index=0, key='x_var')
        with col2:
            y_var = st.selectbox('Y軸の変数を選択してください:', numerical_cols, index=1, key='y_var')

        if x_var and y_var:
            if x_var == y_var:
                st.warning("同じ変数をX軸とY軸に選択しました。異なる変数を選択してください。")
            else:
                x = df[x_var]
                y = df[y_var]

                # 欠損値を含む行を削除
                data = df[[x_var, y_var]].dropna()
                x = data[x_var]
                y = data[y_var]

                if data.empty:
                    st.error("選択された変数に欠損値が含まれており、プロットできるデータがありません。")
                else:
                    # 回帰直線の計算
                    slope, intercept = np.polyfit(x, y, 1)
                    line = slope * x + intercept

                    # 相関係数の計算
                    corr_coef = x.corr(y)

                    # 散布図と回帰直線のプロット
                    fig = go.Figure()
                    fig.add_trace(go.Scatter(x=x, y=y, mode='markers', name='データ点'))
                    fig.add_trace(go.Scatter(x=x, y=line, mode='lines', name='回帰直線'))

                    fig.update_layout(
                        title=f'散布図と回帰直線： {y_var} vs {x_var}',
                        xaxis_title=x_var,
                        yaxis_title=y_var
                    )

                    st.plotly_chart(fig)

                    # 回帰式と相関係数の表示
                    st.write(f'回帰式: **y = {slope:.2f}ax + {intercept:.2f}**')
                    st.write(f'回帰式（解釈）: **{y_var} = {slope:.2f} × {x_var} + {intercept:.2f}**')
                    st.write(f'相関係数: **{corr_coef:.2f}**')
        else:
            st.warning("X軸とY軸の変数を選択してください。")
    else:
        st.warning("数値変数が2つ以上必要です。")
else:
    pass
