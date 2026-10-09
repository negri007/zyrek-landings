"""Baixa as fotos das landings para a pasta fotos/ (rode hoje: links do Instagram expiram em poucos dias).
Uso: python baixar_fotos.py
"""
import os, urllib.request
FOTOS = {
 "firmo-1.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkmj9GeZ5EWO3-itqf7F0ym-_BAUatXcK05GvSY31rr1AZHxF3zlUy_DLptqtIDQ3_oqnG_7I7e3ntQrDkBtq9AmG4BqokKoN9IB-lGEq2HbVF9S9jxQUz8mZrDv3IGDoWz2FDuLA=w1920-h1080-k-no",
 "firmo-2.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkAbj7vFfe1drM58pYB2FHg0VrdDJz2-dI1CJH71MJrJ2qV4RtRNFb2sIU98CaXk09hNqVpjNQfDW-F2KpNpvHOed1AnZVgjOR5-QvJ4QcOr2o-D5l3DK2_1KsPdgwlvouOvQg=w1920-h1080-k-no",
 "firmo-3.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWmcoQX_6T0Jm58Q565VdYYsu56OX2SSmYjHNRabxBnFHbSzpXbwwdz7H-omNj_Rz9FO9HeW4bKbk18TK19n7pk9D3Dn8_6uMe6HAhyxfTcAdMtB6EHi0gi9FHPsbPbC9TontlmMsw=w1920-h1080-k-no",
 "firmo-4.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWlHydLH3zzMjYwJkxQqaHkfWNtv70NIYC5z-Dc3QZeCSg36k3J1HynV8oMdmC-MKipRuqh4wL9EXmWMZfF7uA_Jvo-CQf-oWz1UHEezZ35HyNscc3SrtznhzR1O98XRIgqJHNQ=w1920-h1080-k-no",
 "lobo-1.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkHypZFns0zO9rsCuF6XSuZdds62Oe07EDmrz-UsOTBBpJ5DiWD4CQMWc6DDgSQ0ccxBb3gLMC-tU7OAbpJqsyL9HwGoVIAzwY6z-YXjd6e_XksRhL14zzdLBxD1TD9xbzu6-nuLQ=w1920-h1080-k-no",
 "lobo-2.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnoaGVV42EPsiB1L7D_RfUKZe1U8FQ-iTM3ERT-FsUCgnjZwb8gskC36DJV5yTbmrG_JSPEfpk38JGtWaHBjnxY4Efj6OHadEx88nTP9BEvjc6gBfo60afFWQm00L5qgPVmHDOW=w1920-h1080-k-no",
 "lobo-3.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWlDcX1WLkG20lwcC64ZvgbnVJDuqo2Tj1Bxr9JrzzngrjPsMrFODewKl-2icweJKcwqNCsUNY4yJcfWGmNMfqy3k1ODIpj2DuOquyxk0UL53LmlVyFmOpJLFwmVR3V0gHCakAiA=w1920-h1080-k-no",
 "lobo-4.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWmVbp3T51fjQDhI6-cjYjLGAhbVtexx7myqkiCTJroASzCTiuctqUxhiT2VA5IasFX96gVCjQCLONbCYUtt6LhjV0YL631OxMhLCYaufx0ei8j4TzYHkPtdDMviQC-XZ7UoEfI57g=w1920-h1080-k-no",
 "planet-patas-1.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnoWuwfEKZffhnP4RVVRtYAhSZ01HiHZFTESwkbemEdst90LGuIkEvjho9DMl0ws5HDzf8wYVo9n5tMrkovLQ2RN_FySa_Y8XB2-7V04EgURTVp8bFBjjgeBxyNc640p8uekCWT=w1920-h1080-k-no",
 "planet-patas-2.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWmATo6qwoRab1vjDG6UH166n86MiXhu8aQmUiEq7EFo-KUm1SwTbzA8ujBaUWpGJKqcZXBl-Ds6xSH0DXnlSDtpdPw5aWc8GH2WQGjw-emh0eUj5cTo6hYjgK-czitHeC7mcUU=w1920-h1080-k-no",
 "planet-patas-3.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWlxXugFrm2iqpUG7KFP2eDfVy5oj2_x-PfrHntA-1gtCDw9uEZ9ICkp_QPC43G2tOijSxOUrO-segRug-BPEoDRpy-WdkdbGCui-f3T25iGkd8Q_pX0dhIHOKkfoaRjID3THgqB=w1920-h1080-k-no",
 "planet-patas-4.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnzwcOB6v6yoikjTlJopOTN4qUNeaQjYG0dgMdH5C5bbxIfzCbewoIhGq90KtUxVJH7GPs5eTBRp9aGKy-gcvZ37hSD7AOYZcqvLot9BOoD0WVrAtbW-uBnME0ceQnhj8c9DYOIi9hkzME=w1920-h1080-k-no",
 "ns-store-1.jpg": "https://lh3.googleusercontent.com/gps-cs-s/ANWiy9SvK0uzLkMtIPK6UP3LhLlWNsRtO65RVMxeljzwRYlZJQh2m1xMOmgE6b2nz5OrAEmQYEcCIjCUSjIodXabD3J0BLiXxCI3Yn4_mXJBouGi25SnW2m_mqWGn3lpwSz0Tl-orcBltA=w1920-h1080-k-no",
 "ns-store-2.jpg": "https://lh3.googleusercontent.com/gps-cs-s/ANWiy9SQvReg3ETkjwgo9Wc1gltHpp_gJDLmwbnR2ZNTtaoYtRoSr-6rH7KIZrA6ooiqjCbBiJAx2daSWNspbSz-eefSKcerOXBSq7uiiBSJVQtESK14VzVgf2sjdJ22YTXLGd-cQ1dc=w1920-h1080-k-no",
 "ns-store-3.jpg": "https://lh3.googleusercontent.com/gps-cs-s/ANWiy9SH0s2qsRj-AKSDh5LQQyk8YYGgc-eaTIT_WY5VaeoK7HvRr7ApnQosdH0LhRdu-7pm-tbKsH71KDoPwbXcvrV2S4hACgv3OrH6eugeON1gGmRdw7RFhVfLYm8SQjHb5YHDuQ0x=w1920-h1080-k-no",
 "ns-store-4.jpg": "https://lh3.googleusercontent.com/gps-cs-s/ANWiy9RaT4Dj-V7MIsOGr04JZOB4rdotAzAZh-ErQxAKVhPJz4zycqqIgNYogIsDGskvjDh-FK33-59n1RdEcTJcJUkebPMf0QTl9-NGJQn-jiuuZdqfDil7m9ptpAmdkHLlJ8tzy04=w1920-h1080-k-no",
 "zero18-1.jpg": "https://lh3.googleusercontent.com/gps-cs-s/ANWiy9TT90WWJzUsPdj1AU0SfwRl3t5oftEvETaEdynbPtbGHmnccbWtqnvJT8KJpyzIRnZVWHwxBZwzlUTvID8yjIC8bonszQptAvnxIbeh3L7FUQZmBLpo12kp4De2MFdSGwOgjFQwSQ=w1920-h1080-k-no",
 "zero18-2.jpg": "https://instagram.fnap7-2.fna.fbcdn.net/v/t51.2885-15/496957165_18075059233854712_8479393382561756062_n.jpg?stp=dst-jpg_e35_p1080x1080_sh2.08_tt6&_nc_ht=instagram.fnap7-2.fna.fbcdn.net&_nc_cat=104&_nc_oc=Q6cZ2gEk34ZQWejDt-jyNx1-yeedM3ySMeqmZPcNtdF0efZxs6InB-tVaHmpoue3a7iB8W4&_nc_ohc=ffhoMK-WT20Q7kNvwGxNeui&_nc_gid=BCskIU3OLqd7HVb9mmt6QQ&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AQOME049Jg_1JnG-kp9Dki4KtByi801Jt2reZBpBAcxscw&oe=6ACC54B3&_nc_sid=8b3546",
 "zero18-3.jpg": "https://instagram.fnap7-2.fna.fbcdn.net/v/t51.2885-15/488777064_18072182467854712_509495893974604389_n.jpg?stp=dst-jpg_e35_p1080x1080_sh2.08_tt6&_nc_ht=instagram.fnap7-2.fna.fbcdn.net&_nc_cat=104&_nc_oc=Q6cZ2gEk34ZQWejDt-jyNx1-yeedM3ySMeqmZPcNtdF0efZxs6InB-tVaHmpoue3a7iB8W4&_nc_ohc=QzzZxDbPXyMQ7kNvwG-TcmG&_nc_gid=BCskIU3OLqd7HVb9mmt6QQ&edm=AOQ1c0wBAAAA&ccb=7-5&ig_cache_key=MzYwNTcyNTg2OTQwMzM0MzI1NQ%3D%3D.3-ccb7-5&oh=00_AQMo2x381fVZVCuBYz06sAjH8S2KKT-3ihiFjigOUKNLcA&oe=6ACC5C41&_nc_sid=8b3546",
 "zero18-4.jpg": "https://instagram.fnap7-2.fna.fbcdn.net/v/t51.2885-15/491462416_18073107121854712_3528588548778860614_n.jpg?stp=dst-jpg_e35_p1080x1080_sh2.08_tt6&_nc_ht=instagram.fnap7-2.fna.fbcdn.net&_nc_cat=104&_nc_oc=Q6cZ2gEk34ZQWejDt-jyNx1-yeedM3ySMeqmZPcNtdF0efZxs6InB-tVaHmpoue3a7iB8W4&_nc_ohc=WMYxByI2h94Q7kNvwEFjCgy&_nc_gid=BCskIU3OLqd7HVb9mmt6QQ&edm=AOQ1c0wBAAAA&ccb=7-5&ig_cache_key=MzYxMzU4NzM2NTUyMDU5MTgzOA%3D%3D.3-ccb7-5&oh=00_AQM3s_xLm7bRr9hzF_MEukJUIaZd_sEUIe28-gUnD9P8wA&oe=6ACC5B5B&_nc_sid=8b3546",
 "da-vinti-1.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnW2uYgbcJK-tkaI7zGfsW1yXKcQOcpoiN-sePtWIfP6o_fG7bI74ssJBVL65rj9n96AvAHb9dAk5uu1yzctpI_HGPUQ4icwDAHFzaBwPlOMmH9efY3wA8DS6SnFjb9jgKLBYts=w1920-h1080-k-no",
 "da-vinti-2.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWmP1lJyfPkzmRpHAPS883oDFOBjMyTf1BpCWCrUKpvf7tJvFeqzDnAO4jxFcsR04nWafecjDQAxi4QT4nUgP-liiVKhHOSBywN5UIMUNYo33oDzcs5LCG5ngMba3bB2h1Xc2TeKsQ=w1920-h1080-k-no",
 "da-vinti-3.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkrVcG4bYOIJC2Ys4iBSNFUdDqzi_a4enVVhYfDNDwlrmAGlRD0s1t41sexP6h9ZwN0c_0GitAK1Xah8W8-hcAIVuhDSFibNmoTLuE0ytaK-tMgalsKjQYZh1Q_5BDXt2zisShxAY5zPbPa=w1920-h1080-k-no",
 "da-vinti-4.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnOsKKcLekVkxShDtuulwj_nfFCpHxIiAbr-nHRgrxozYreQqkiDU73dvBva0-dT9G9l6RfxaAQmX9ewdAfGVXOg5QYdXebh_PsCjFjX0777Yf1-9FNp-AsMiw0bGyNFh4nExJmUAjg_tI=w1920-h1080-k-no",
 "claudio-radiadores-1.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkno4xJPULxpY9zFmfUTtadfmn_2BnNBZADXWl3evgNF18bcGYonfb3Qg5vrW-Sc5RBb1Zu_J6-3D-ZVRdvR010dIgK-THn8dXb1bJbrTh1mzQQpLIv-GA8G5Jqe8y68ERpwGUFtw=w1920-h1080-k-no",
 "claudio-radiadores-2.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWlux_6qpg23XU9VLELPYwQ23ciRBzvIS9kuATwXW9EDPtdE4CYZzNj3eNGPGbzTfPYBf7aR_BQgtrEzocfNgoLIHA9DU8cUuFqZ27dlUp7m-Ql1IGU9_nSt8DgyaUlRkSdWuKcCcw=w1920-h1080-k-no",
 "claudio-radiadores-3.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWk22mXkZE5VrsOkbmuFayvCapivH5_zNuC3Aw_VWyJ_H5_hf4HlUYihMVa2kpI5aEncGes5qRR98_G0p3szI-4JSVmElYP3nfDzwUM4LMhmkHPJF1vEqpuHVvp0rFzkZ5DWa9Kdag=w1920-h1080-k-no",
 "claudio-radiadores-4.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWl9OUElSvdLIkjteRIBSlOkC-KINdGKeGwxE-YyS_lNVOgc4vViMnIM_OEdEEWzgQA7JzkHlkxtcMNdLBpBV4LiZI4FZvLzab3L8UM8kv2xrKijis0SU1bu0Zzv-Nou7FQ9MuhVUw=w1920-h1080-k-no",
 "garage-1.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWlOCW5zXliMIJnzGmeTFZu9hpCgfWGwHud8lWjA0UUwWK4gWgMXCM3Fct3nj6c3NbFU4e_7O7NsYxc2TpmKt0pw0LAs_Kvz6BTtN_k499hlfC7iLow-sfSDGxY4xvSPLdUis4Q1bVv7D0Pv=w1920-h1080-k-no",
 "garage-2.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnOasreR6aRjc-_puLMxpyZBtdq1vl6iB4bgHezydtWa7izClnrv6lFwkuhZPmNsVxGyp6e4u74PjZ8MLJBSgocNxOIsR4jsIgAluf4YWTNcLaatNMO76Tr_P8osKxjyE8Mk0a3=w1920-h1080-k-no",
 "garage-3.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkx_mrJZBAg89ooYydF1jbfNkEYCdrtZKapMQykXRcSWokF5VTF86Ava38zJ5lFPnq4Zps6QSlgxu-Iqsir6DWKu4FUXN2OjwxyqiPbgq1uk43koAB_lQ3EvowA1XgdiMLLCSE=w1920-h1080-k-no",
 "garage-4.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnyk1mF0qUsoi4N9dmDF8kGiax8hMhTJVO7yb1EMWCq2JOAthjPWBcMSyKJcMGnBVNQPb1c7-uR5PRPVPcPhC4WwC1YYpxe0cyrbUrEk_nYeQ8-0yY8CSSab5MW6q9siggbDjj8R8da1nrT=w1920-h1080-k-no",
 "tamara-1.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWlkDUs6KRqRHQ2c4euKua34lszAJmXl-nLdlX6JsbrSkNQ1g6fkM7WvR8K-PChs8yKbjZgL2t3g1jTiy5eEFJwZeujUrcGkKiAUb8gIZWZfemEbo2CfZyjcxpbbW1rKTD2KuUHew5WLgrGa=w1920-h1080-k-no",
 "tamara-2.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnxh2LdWmKn3HVPCsaHldQtODaQmJVfRp58u8S8IUAfM0CWA9hDLTIlGAI3wH1wYYTR_A6o9nIX4bqzo9sMeBq89ujVUmvg_qm4hxrtF9pd0kCsij5OrZ1tIoCQYZoO2W0lKIbgMUituLjE=w1920-h1080-k-no",
 "tamara-3.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnv2rlBRI5OVgLNo_zLE5t0HMCodZ6YLyj-CxOKqUsfI50wZ2eUlu2EHD7tEVt0bO5YXEeVRoF4Lod3hW7_vJhlqP33LW8qAUTDnFOc7qhjCI8HClkoxPidN1CR2kiZ5OYOODATyqxRzsBM=w1920-h1080-k-no",
 "tamara-4.jpg": "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWmUJcDzeQVNfP6DuG0NON4kP9l-0MiFbdZ5ocTnnTcrLGunKpv6lJZn6kA5smtjqbIUMzOAdJjNWCbFjn3pPAJaTVfj0lBssArklhs8G7Ent8xiGzIZEJ9JAiu_rce2rg0YhBWSWQ=w1920-h1080-k-no",
 "hulk-1.jpg": "https://lh3.googleusercontent.com/gps-cs-s/ANWiy9QRLwiUDhi90btGicX-pkWHwrdoEOrREBpqAfFMas3pEQ2q7WfZgFFey6gKf4GOCvQ3hM9XqlVg2vm3ZwR7M0gs0HMeSsV699vU5hVVW4xBURtfuS0CVBsjwq-pMaTKtMx3MZj7RQ=w1920-h1080-k-no",
 "hulk-2.jpg": "https://lh3.googleusercontent.com/gps-cs-s/ANWiy9SXmNvmjRmrEo2ewlvlufmBRyh90XrRjNFdfRffXx_y8xuPh9uNfYsye3wSwdfe7dgvDhDVu8ftjo0QsjlvDvdphKB6mQVNG4tNGmyJnwx2YAYTLD6g9-Q7CvZBS_5Fo1FIbKWU9A=w1920-h1080-k-no",
 "hulk-3.jpg": "https://lh3.googleusercontent.com/gps-cs-s/ANWiy9SoCfzDjTOA4HjSIhvAxb_VaJHkj7mJFyNZlR__4he1hw9rh-ak5sllcuzO9Ta0VBdxRSXY-nGzLRFQy21c1YnVBHqNa6CDSvL3W_BZXcL-zQebhahMP2fKDbsomcrau8DZzjmbEA=w1920-h1080-k-no",
 "hulk-4.jpg": "https://lh3.googleusercontent.com/gps-cs-s/ANWiy9ScqTPch3cJsa53yvMBRCvf1eYOAc5bE0I6TPr4xwWcBbfocfj-08dJtWd0OwexjRt5wmlBgBPkMIZ63jguJRddsdrYiKexyN6Hoida6UJlzGccI-fpGr-wpY2s7kdjAv6DfSaWhJXoST0=w1920-h1080-k-no"
}
os.makedirs("fotos", exist_ok=True)
ok = 0
for nome, url in FOTOS.items():
    destino = os.path.join("fotos", nome)
    if os.path.exists(destino):
        continue
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as r, open(destino, "wb") as f:
            f.write(r.read())
        ok += 1
        print("ok ", nome)
    except Exception as ex:
        print("falhou", nome, "-", ex)
print(f"{ok} fotos baixadas em fotos/")
