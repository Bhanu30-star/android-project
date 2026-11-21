<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['distributor_user_id']) && isset($_POST['sdate']))
{
	$dis_uid = $_POST['distributor_user_id'];
	$ver = $_POST['distributor_id'];
	$select_user=mysqli_query($con,"SELECT imei_no,session_id FROM tbl_distributor_users where status='Active' and distributor_user_id='$dis_uid'");
	if(mysqli_num_rows($select_user)>0)
	{     
		while($fetch_user=mysqli_fetch_array($select_user))
		{
			$response['user_status']='1';
			$response['user_imei']=$fetch_user['imei_no'];
			$response['session_id']=$fetch_user['session_id'];
		}
	}
	else
	{
			
		$response['user_status']='0';
		$response['session_id']='';
		$response['user_imei']='';
	}
	$s_date  = $_POST['sdate'];
	
	
	$res = mysqli_query($con,"select tbl_user_request.transaction_id,tbl_user_request.user_transaction_id,tbl_user_request.user_id,tbl_user.user_name,tbl_user.work_type,party_id,tbl_user.user_phone,tbl_user_request.total_amount,tbl_user_request.transaction_date,tbl_user_request.transaction_time,tbl_user_request.request_type,tbl_user_request.status as request_status from tbl_user_request,tbl_user where tbl_user_request.user_id=tbl_user.user_id and tbl_user_request.status!='Pending' and tbl_user.distributor_id='$ver' and ( tbl_user_request.complete_date='$s_date' or tbl_user_request.cancel_datetime like  '".$s_date."%' )");
	if(mysqli_num_rows($res)>0)
	{    
		$executive=array();
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			$executive['request_id']=$fetch_product['transaction_id'];
			$executive['request_txn_id']=$fetch_product['user_transaction_id'];
			$executive['request_type']=$fetch_product['request_type'];
			$executive['user_id']=$fetch_product['user_id'];
			$executive['user_name']=$fetch_product['user_name'];
			$executive['request_status']=$fetch_product['request_status'];
			$work_type=$fetch_product['work_type'];
			$request_id=$fetch_product['transaction_id'];
			if($work_type=="FMCG")
			{
				$party_id=$fetch_product['party_id'];
				$res_party = mysqli_query($con,"select party_name from tbl_party where party_id='$party_id'"); 
				while($fetch_party=mysqli_fetch_assoc($res_party))
				{
					$executive['party_name']=$fetch_party['party_name'];
				}
			}
			else
			{
			  $executive['party_name']=''; 
			}
			
			$executive['user_phone']=$fetch_product['user_phone'];
			$executive['total_amount']=$fetch_product['total_amount'];
			$executive['transaction_date']=$fetch_product['transaction_date'];
			$executive['transaction_time']=$fetch_product['transaction_time'];
			$executive['executivedetail']=array(); 
			$res11 = mysqli_query($con,"select tbl_user_request_detail.transaction_detail_id,tbl_user_request_detail.product_name,tbl_user_request_detail.quantity,tbl_user_request_detail.product_id from tbl_user_request_detail,tbl_product where  tbl_user_request_detail.product_id=tbl_product.product_id and tbl_user_request_detail.transaction_id='$request_id'");
			if(mysqli_num_rows($res11)>0)
			{    
				while($fetch_product=mysqli_fetch_assoc($res11))
				{
					$executivedetail['transaction_detail_id']=$fetch_product['transaction_detail_id'];
					$executivedetail['product_id']=$fetch_product['product_id'];
					$executivedetail['product_name']=$fetch_product['product_name'];
					$executivedetail['quantity']=$fetch_product['quantity'];
					$executive['executivedetail'][]=$executivedetail;
				}
			}
			$response['executive'][]=$executive;
		}
		$response['success']='1';
		$response['details']="Data Retrieved Successfully!";
	}
	else
	{
		$response['success']='0';
		$response['details']="No Request Available!!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing!!";
}	
echo json_encode($response);

?>