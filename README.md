# Software-Defined-System-KUB

**Software-Defined System Term Project:** Build the Kubernetes cluster using Raspberry PI with this project
From [Github Project](https://github.com/juierror/todolist-microservice)

## Topology
Kubenetes cluster topology 

| Device                                   |             IP Address             |
| ---------------------------------------- | :--------------------------------: |
| Master 1 [VM]                            |           192.168.0.121            |
| Master 2 [VM]                            |           192.168.0.122            |
| Load Balancer for Master [VM] - HA Proxy |           192.168.0.100            |
| Worker Node [Raspberry PI]               | 192.168.0.110 - 192.168.0.113      |

## Set up Kubernetes cluster

### Set up Worker Node [Raspberry PI]
First, we flash Raspberry Pi os to Raspbian Stretch Lite.

Set up process can be followed in [this medium article](https://medium.com/nycdev/k8s-on-pi-9cc14843d43).

and some process in [this article](https://blog.inkubate.io/install-and-configure-a-multi-master-kubernetes-cluster-with-kubeadm)

### Preparing Master Node

We create multi-master using 2 VMs  The chosen linux distribution for master nodes is ubuntu server 16.04 From Our Class

> Important:
> Ensure that each master VM has different hostname and MAC address***

We followed [# this guide](https://blog.inkubate.io/install-and-configure-a-multi-master-kubernetes-cluster-with-kubeadm)

> Please update and upgrade on all device
```
sudo apt-get update
sudo apt-get upgrade
```
#### Install and setup Docker On Master
1. Get administrator privileges(root).
```sudo -s```
2. Add the Docker repository key.
```curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -```
3. Add the Docker repository.
add-apt-repository \
```"deb https://download.docker.com/linux/$(. /etc/os-release; echo "$ID") \
$(lsb_release -cs) \
stable"
```
4. Update the list of packages.
```apt-get update```
5. Install docker-ce 17.03
if Master follow this [Link](https://docs.docker.com/install/linux/docker-ce/ubuntu)
  
#### Install and setup kubeadm, kubelet and kubectl On Master
1. Add the Google repository key.
```curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -```
2. Add the Google repository.
```vim /etc/apt/sources.list.d/kubernetes.list
deb http://apt.kubernetes.io kubernetes-xenial main
```
3. Update the list of packages.
```apt-get update```
4. Install kubelet, kubeadm and kubectl.
```apt-get install kubelet kubeadm kubectl```
5. Disable the swap.
```swapoff -a
sed -i '/ swap / s/^/#/' /etc/fstab
```

#### Install client tool
##### Install cfssl(Cloudfare SSL)
1. Download the binaries.
```wget https://pkg.cfssl.org/R1.2/cfssl_linux-amd64
wget https://pkg.cfssl.org/R1.2/cfssljson_linux-amd64
```
2. Add the execution permission to the binaries.
```chmod +x cfssl*```
3. Move the binaries to /usr/local/bin.
```sudo mv cfssl_linux-amd64 /usr/local/bin/cfssl
sudo mv cfssljson_linux-amd64 /usr/local/bin/cfssljson
```
4. Verify the installation.
```cfssl version```

##### Install kubectl
1. Download the binary.
```wget https://storage.googleapis.com/kubernetes-release/release/v1.12.1/bin/linux/amd64/kubectl
```
2. Add the execution permission to the binary.
```chmod +x kubectl```
3. Move the binary to /usr/local/bin.
```sudo mv kubectl /usr/local/bin```
4. Verify the installation.
```kubectl version```

##### Set up Load Balancer for master - HAProxy
1. Install HAProxy.
```sudo apt-get install haproxy```
2. Configure HAProxy to load balance the traffic between the three Kubernetes master nodes.
```sudo vim /etc/haproxy/haproxy.cfg
global
...
default
...
frontend kubernetes
bind 192.168.0.100:6443
option tcplog
mode tcp
default_backend kubernetes-master-nodes


backend kubernetes-master-nodes
mode tcp
balance roundrobin
option tcp-check
server sds-master-121 192.168.0.121:6443 check fall 3 rise 2
server sds-master-122 192.168.0.122:6443 check fall 3 rise 2
```
3. Restart HAProxy.
```sudo systemctl restart haproxy```

##### Generate TLS certificates
1. Create the certificate authority configuration file.
```vim ca-config.json
{
  "signing": {
    "default": {
      "expiry": "8760h"
    },
    "profiles": {
      "kubernetes": {
        "usages": ["signing", "key encipherment", "server auth", "client auth"],
        "expiry": "8760h"
      }
    }
  }
}
```
2. Create the certificate authority signing request configuration file.
```vim ca-csr.json
{
  "CN": "Kubernetes",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
  {
    "C": "IE",
    "L": "Cork",
    "O": "Kubernetes",
    "OU": "CA",
    "ST": "Cork Co."
  }
 ]
}
```
3. Generate the certificate authority certificate and private key.
```cfssl gencert -initca ca-csr.json | cfssljson -bare ca```
4. Verify that the ca-key.pem and the ca.pem were generated.
```ls -la```
5. Create the certificate signing request configuration file.
```vim kubernetes-csr.json
{
  "CN": "kubernetes",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
  {
    "C": "IE",
    "L": "Cork",
    "O": "Kubernetes",
    "OU": "Kubernetes",
    "ST": "Cork Co."
  }
 ]
}
```
6. Generate the certificate and private key.
```cfssl gencert \
-ca=ca.pem \
-ca-key=ca-key.pem \
-config=ca-config.json \
-hostname=192.168.0.121,192.168.0.122,192.168.0.100,127.0.0.1,kubernetes.default \
-profile=kubernetes kubernetes-csr.json | \
cfssljson -bare kubernetes
```
7. Verify that the kubernetes-key.pem and the kubernetes.pem file were generated.
```ls -la```
8. Copy the certificate to each nodes.
```
scp ca.pem kubernetes.pem kubernetes-key.pem natthapong@192.168.0.121:~
scp ca.pem kubernetes.pem kubernetes-key.pem natthapong@192.168.0.122:~
scp ca.pem kubernetes.pem kubernetes-key.pem pi@192.168.0.110:~
scp ca.pem kubernetes.pem kubernetes-key.pem pi@192.168.0.111:~
scp ca.pem kubernetes.pem kubernetes-key.pem pi@192.168.0.112:~
scp ca.pem kubernetes.pem kubernetes-key.pem pi@192.168.0.113:~
```

#### Installing and configuring Etcd on the Master machine
1. Create a configuration directory for Etcd.
```sudo mkdir /etc/etcd /var/lib/etcd```
2. Move the certificates to the configuration directory.
```sudo mv ~/ca.pem ~/kubernetes.pem ~/kubernetes-key.pem /etc/etcd```
3. Download the etcd binaries.
```wget https://github.com/coreos/etcd/releases/download/v3.3.9/etcd-v3.3.9-linux-amd64.tar.gz
```
4. Extract the etcd archive.
```tar xvzf etcd-v3.3.9-linux-amd64.tar.gz
```
5. Move the etcd binaries to /usr/local/bin.
```sudo mv etcd-v3.3.9-linux-amd64/etcd* /usr/local/bin/
```
6. Create an etcd systemd unit file.
```sudo vim /etc/systemd/system/etcd.service
[Unit]
Description=etcd
Documentation=https://github.com/coreos


[Service]
ExecStart=/usr/local/bin/etcd \
  --name [[your.master.IP]] \
  --cert-file=/etc/etcd/kubernetes.pem \
  --key-file=/etc/etcd/kubernetes-key.pem \
  --peer-cert-file=/etc/etcd/kubernetes.pem \
  --peer-key-file=/etc/etcd/kubernetes-key.pem \
  --trusted-ca-file=/etc/etcd/ca.pem \
  --peer-trusted-ca-file=/etc/etcd/ca.pem \
  --peer-client-cert-auth \
  --client-cert-auth \
  --initial-advertise-peer-urls https://[[your.master.IP]]:2380 \
  --listen-peer-urls https://[[your.master.IP]]:2380 \
  --listen-client-urls https://[[your.master.IP]]:2379,http://127.0.0.1:2379 \
  --advertise-client-urls https://[[your.master.IP]]:2379 \
  --initial-cluster-token etcd-cluster-0 \
  --initial-cluster 192.168.0.121=https://192.168.0.121:2380,192.168.0.122=https://192.168.0.122:2380 \
  --initial-cluster-state new \
  --data-dir=/var/lib/etcd
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```
7. Reload the daemon configuration.
```sudo systemctl daemon-reload```
8. Enable etcd to start at boot time.
```sudo systemctl enable etcd```
9. Start etcd.
```sudo systemctl start etcd```

#### Initialize master node
1. Create the configuration file for kubeadm.
```vim config.yaml
apiVersion: kubeadm.k8s.io/v1beta1
kind: ClusterConfiguration
kubernetesVersion: stable
apiServer:
  CertSANs:
    - 192.168.0.100
controlPlaneEndpoint: "192.168.0.100:6443"
etcd:
  external:
    endpoints:
    - https://192.168.0.121:2379
    - https://192.168.0.122:2379
    caFile: /etc/etcd/ca.pem
    certFile: /etc/etcd/kubernetes.pem
    keyFile: /etc/etcd/kubernetes-key.pem
```
2. Initialize the machine as a master node.
```sudo kubeadm init --config=config.yaml```
3. Copy the certificates to the other master.(or do 1st and 2nd step in other master)
```sudo scp -r /etc/kubernetes/pki natthapong@192.168.0.122:~```
#### Initialize each worker node
Run the following command
```sh
sudo kubeadm join 192.168.0.104:6443 --token <your-token> --discovery-token-ca-cert-hash sha256:<your-discovery-token-ca-cert-hash>
```
> From now, Your cluster should be now ready to deploy applications!

