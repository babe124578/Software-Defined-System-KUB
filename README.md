# Software-Defined-System-KUB

**Software-Defined System Term Project:** Build the Kubernetes cluster using Raspberry PI with this project
From [Github Project](https://github.com/juierror/todolist-microservice)

## Project structure
- nginx หงิง

## Topology
Kubenetes cluster topology 

| Device                                   |             IP Address             |
| ---------------------------------------- | :--------------------------------: |
| Master 1 [VM]                            |           192.168.0.121            |
| Master 2 [VM]                            |           192.168.0.122            |
| Load Balancer for Master [VM] - HA Proxy |           192.168.0.100            |
| Worker Node [Raspberry PI]               | 192.168.0.110 - 192.168.0.113.     |

## Set up Kubernetes cluster

### Set up Worker Node [Raspberry PI]
First, we flash Raspberry Pi os to Raspbian Stretch Lite.

Set up process can be followed in [this medium article](https://medium.com/nycdev/k8s-on-pi-9cc14843d43).

and some process in [this article](https://blog.inkubate.io/install-and-configure-a-multi-master-kubernetes-cluster-with-kubeadm)

### Preparing Master Node

We create multi-master using 2 VMs  The chosen linux distribution for master nodes is ubuntu server 16.04 From Our Class

> Important:
> Ensure that each master VM has different hostname and MAC address***

We followed [#this guide](https://blog.inkubate.io/install-and-configure-a-multi-master-kubernetes-cluster-with-kubeadm)

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
follow this [Link](https://docs.docker.com/install/linux/docker-ce/ubuntu)

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

#### Install certificate on all nodes and masters
##Install cfssl(Cloudfare SSL)
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

#### Set up Load Balancer for master - HAProxy
  1.Install Haproxy
  ```sudo apt-get update
     sudo apt-get install haproxy
  ```
  2.Edit haproxy.cfg
  ``` nano /etc/haproxy/haproxy.cfg ```
  3.Add this configuration parameters to HAProxy config :
  ```global
    user haproxy
    group haproxy
defaults
    mode http
    log global
    retries 2
    timeout connect 3000ms
    timeout server 5000ms
    timeout client 5000ms
frontend kubernetes
    bind (IP OF YOUR LOADBALANCE)
    option tcplog
    mode tcp
    default_backend kubernetes-master-nodes
backend kubernetes-master-nodes
    mode tcp
    balance roundrobin
    option tcp-check
    server k8s-master-0 (IP OF YOUR FIRST MASTER NODE) check fall 3 rise 2. 
    server k8s-master-1 (IP OF YOUR SECOND MASTER NODE) ccheck fall 3 rise 2
  ```
  4. Start HAproxy
   ```systemctl start haproxy```
  
#### Initialize cluster

After load balancer for master nodes was set, the cluster with stacked etcd-control plane can be initialized. The process is based on 2 sources which is [this medium article](https://medium.com/nycdev/k8s-on-pi-9cc14843d43) and [official kubeadm HA cluster guide](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/high-availability/).

> From now, we assume that master nodes' load balancer is at 192.168.0.104:6443

#### Initialize first master node

1. Init kubernetes cluster
```sh
sudo kubeadm init --control-plane-endpoint "192.168.0.104:6443" --upload-certs --token-ttl=0
```
2. Setup kubectl
```sh
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```
3. Install weavenet
```sh
kubectl apply -f "https://cloud.weave.works/k8s/net?k8s-version=$(kubectl version | base64 | tr -d '\n')"
```
> If you want to use kubectl on your other machine, use the same config in step 2 to set up kubectl on it.

#### Initialize second master node

Run the following command
```sh
sudo kubeadm join 192.168.0.194:6443 --token <your-token> --discovery-token-ca-cert-hash sha256:<your-discovery-token-ca-cert-hash> --control-plane --certificate-key <your-certificate-key>
```

> Your master nodes should be all set! Try getting nodes status with `kubectl get nodes`

#### Initialize each worker node

Run the following command
```sh
sudo kubeadm join 192.168.0.104:6443 --token <your-token> --discovery-token-ca-cert-hash sha256:<your-discovery-token-ca-cert-hash>
```

> From now, Your cluster should be now ready to deploy applications!

## Deploy the application to Kubernetes cluster

1.Install OpenFaas Cli
  ```
  curl -sL https://cli.openfaas.com | sudo sh
  ```
  
2. Clone Project From [Github Project](https://github.com/openfaas/faas-netes)

3. Goto Directory Of Project

4. Run Command
  ```
     kubectl apply -f namespace.yml
     kubectl apply -f yaml_armhf/
  ```
5.Check If Deploy Complete
  ``` 
      kubectl get deploy -n openfaas
      kubectl get pods --all-namespaces
  ```
6.Goto localhost:31112 to SEE UI


