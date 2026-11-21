<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['transaction_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$einv_txn=$_POST['transaction_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d");
	$ctime  = date("H:i:s");
	$query1=mysqli_query($con,"select * from tbl_party_einvoice where transaction_id='$einv_txn' and distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($query1)>0)
	{     
		while($fetch_product2=mysqli_fetch_assoc($query1))
		{
			if($fetch_product2['status']=="Pending" && $fetch_product2['json_data']!='') 
			{
				$qry11=mysqli_query($con,"UPDATE `tbl_party_einvoice` SET delete_date='$da',delete_time='$ctime',status='Deleted' WHERE transaction_id='$einv_txn' and distributor_id='$session_dist_ver'");
				$response['success']='1';
				$response['details']="E-Invoice Error JSON Successfully Cleared...!!";
			}
			else if($fetch_product2['status']=="Complete" && $fetch_product2['json_data']!='' && $fetch_product2['Irn']!='') 
			{
				$current_dtime=date("Y-m-d H:i:s");
				$token_genrate_flag=0;
				$response_new = array();
				$response_new['Irn']=$fetch_product2['Irn'];
				$response_new['CnlRsn']="1";
				$response_new['CnlRem']='Wrong entry';
				
				$select_client_data=mysqli_query($con,"select einvoice_username,einvoice_password,gstin_no from `tbl_distributor` where distributor_id='$session_dist_ver'");
				while($fetch_client_data=mysqli_fetch_assoc($select_client_data))
				{
					$clnt_gstuname=$fetch_client_data['einvoice_username'];
					$einvoice_password=$fetch_client_data['einvoice_password'];
					$einvoice_gstin_no=$fetch_client_data['gstin_no'];
				}
				
				$select_client_token=mysqli_query($con,"select * from tbl_party_einvoice_token_detail where distributor_id='$session_dist_ver' and insert_date='$da' and status='Active'");
				if(mysqli_num_rows($select_client_token)>0)
				{
					while($fetch_client_token=mysqli_fetch_assoc($select_client_token))
					{
						$today_time = date("Y-m-d H:i:s",strtotime($current_dtime));
						$expire_time = date("Y-m-d H:i:s",strtotime($fetch_client_token['expired_datetime']));
						if ($expire_time < $today_time) 
						{
							$token_genrate_flag=0;
						}
						else
						{
							$client_authtkn=$fetch_client_token['token_value'];
							$token_genrate_flag=1;
						}
					}
				}
				
				if($token_genrate_flag==0)
				{
					$url_token = "https://einvapi.charteredinfo.com/eivital/dec/v1.04/auth?&aspid=1684392722&password=Jaipur@123&Gstin=".$einvoice_gstin_no."&user_name=".$clnt_gstuname."&eInvPwd=".$einvoice_password;
					$ch_session_tkn = curl_init();
					curl_setopt($ch_session_tkn, CURLOPT_RETURNTRANSFER, 1);
					curl_setopt($ch_session_tkn, CURLOPT_URL, $url_token);
					$result = curl_exec($ch_session_tkn);
					curl_close($ch_session_tkn);
					$decoded_json_tkn = json_decode($result, true);
					if($decoded_json_tkn["Status"]==1)
					{
						$client_authtkn = $decoded_json_tkn["Data"]["AuthToken"];
						$authtkn_expiry = $decoded_json_tkn["Data"]["TokenExpiry"];
						$dist_updt_token=mysqli_query($con,"UPDATE tbl_party_einvoice_token_detail SET status='Expired' WHERE distributor_id='$session_dist_ver' and insert_date='$da' and status='Active'");
						$dist_insert_token = mysqli_query($con,"INSERT INTO `tbl_party_einvoice_token_detail`(`distributor_id`, `token_value`, `status`, `insert_date`, `insert_time`, `expired_datetime`)VALUES('$session_dist_ver','$client_authtkn','Active','$da','$ctime','$authtkn_expiry')");
					}
				}
				if($client_authtkn!='')
				{
					$url = 'https://einvapi.charteredinfo.com/eivital/dec/v1.04/Cancel?aspid=1684392722&password=Jaipur@123&Gstin='.$einvoice_gstin_no.'&eInvPwd='.$einvoice_password.'&AuthToken='.$client_authtkn.'&user_name='.$clnt_gstuname;
					
					$ch_session = curl_init();
					$payload = json_encode ($response_new);
					curl_setopt_array($ch_session, array(
					CURLOPT_URL => $url,
					CURLOPT_RETURNTRANSFER => true,
					CURLOPT_ENCODING => '',
					CURLOPT_MAXREDIRS => 10,
					CURLOPT_TIMEOUT => 0,
					CURLOPT_FOLLOWLOCATION => true,
					CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
					CURLOPT_CUSTOMREQUEST => 'POST',
					CURLOPT_POSTFIELDS =>$payload,
					CURLOPT_HTTPHEADER => array(
						'Content-Type: application/json'
					),
					));
					$result_data = curl_exec($ch_session);
					curl_close($ch_session);
					$decoded_json = json_decode($result_data, true);
					
					if($decoded_json['Status']==0)
					{
						$qry11=mysqli_query($con,"UPDATE `tbl_party_einvoice` SET delete_json_data='$result_data' WHERE transaction_id='$einv_txn' and distributor_id='$session_dist_ver'");
						
						$response['success']='0';
						$response['details']="E-Invoice Transaction Not Allowed to Delete...!!";
					}
					else if($decoded_json['Status']==1)
					{
						$qry11=mysqli_query($con,"UPDATE `tbl_party_einvoice` SET delete_date='$da',delete_time='$ctime',status='Deleted',delete_json_data='$result_data'  WHERE transaction_id='$einv_txn' and distributor_id='$session_dist_ver'");
						$response['success']='0';
						$response['details']="E-Invoice Detail successfully Deleted...!!";
					}
				}
			}
		}
	}
	else
	{
		$response['success']='0';
		$response['details']="E-Invoice Detail Not Valid..Please check and try again later.!!";
	}
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>