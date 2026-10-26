# 谐振子含时演化数值计算
# 计算一维量子谐振子在初始高斯波包下的含时演化

using LinearAlgebra

const HBAR = 1.0
const M = 1.0
const OMEGA = 1.0

# 坐标网格
const XMIN = -10.0
const XMAX = 10.0
const NX = 512
const DX = (XMAX - XMIN) / NX
const xs = range(XMIN, XMAX - DX, length=NX)

# 初始高斯波包：中心 x0，动量 p0
function gaussian_wavepacket(x, x0, p0, sigma)
    return (1.0 / (pi * sigma^2)^0.25) *
           exp(-(x - x0)^2 / (2 * sigma^2)) *
           exp(im * p0 * x / HBAR)
end

# 势能 V(x) = 1/2 m ω² x²
function potential(x)
    return 0.5 * M * OMEGA^2 * x^2
end

# 构建哈密顿量的有限差分矩阵
function hamiltonian_matrix()
    k2 = zeros(NX, NX)
    for i in 1:NX
        k2[i, i] = -2.0 / DX^2
        if i > 1
            k2[i, i-1] = 1.0 / DX^2
        end
        if i < NX
            k2[i, i+1] = 1.0 / DX^2
        end
    end
    V = Diagonal([potential(x) for x in xs])
    return -HBAR^2 / (2 * M) * k2 + V
end

# 用 split-operator 法做一步演化
function time_step(psi, H, dt)
    U = exp(-im * dt * H / HBAR)
    return U * psi
end
