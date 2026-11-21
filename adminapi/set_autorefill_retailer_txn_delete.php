<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['message_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("h:i:s");
	$dist_sg_id = $_POST['message_id'];
	
	$cart=mysqli_query($con,"SELECT * FROM tbl_autofill_retailer_message_detail WHERE message_id='$dist_sg_id' AND distributor_id='$session_dist_ver' and status='Transfer' and txn_status='Pending'");
	if(mysqli_num_rows($cart)>0)
	{
		while($fetch_data=mysqli_fetch_assoc($cart))
		{
			$pro_price=$fetch_data['product_price_val'];
			$pro_val=$fetch_data['product_id'];
			$pro_cat='';
			if($fetch_data['operator_detail']=="JIO")
				$pro_cat='JIO BALANCE';
			else if($fetch_data['operator_detail']=="Airtel")
				$pro_cat='LAPU BALANCE';
			$cart_ins=mysqli_query($con,"INSERT INTO `tbl_autofill_retailer_message_detail_history`(`message_id`, `distributor_id`, `user_id`, `operator_detail`, `transaction_id`, `amount`, `party_phone`, `message_date`, `message_time`, `insert_date`, `insert_time`, `order_type`, `status`, `txn_status`, `upload_by`, `party_name_value`, `collection_date`, `file_name_detail`, `unique_id_val`, `update_by`, `insert_at`, `pro_price`) VALUES ('$dist_sg_id','$session_dist_ver','".$fetch_data['user_id']."','".$fetch_data['operator_detail']."','".$fetch_data['transaction_id']."','".$fetch_data['amount']."','".$fetch_data['party_phone']."','".$fetch_data['message_date']."','".$fetch_data['message_time']."','".$fetch_data['insert_date']."','".$fetch_data['insert_time']."','".$fetch_data['order_type']."','".$fetch_data['status']."','".$fetch_data['txn_status']."','".$fetch_data['upload_by']."','".$fetch_data['party_name_value']."','".$fetch_data['collection_date']."','".$fetch_data['file_name_detail']."','".$fetch_data['unique_id_val']."','".$fetch_data['update_by']."','".$fetch_data['insert_at']."','$pro_price')");       
			if($cart_ins)
			{
				if($pro_val==0)
				{
					$res_stock = mysqli_query($con,"select * from tbl_user_request_detail where product_id in (select product_id from tbl_product where product_category='$pro_cat' and distributor_id='$session_dist_ver') and transaction_id in (select transaction_id from tbl_user_request where type='Autofill' and user_id='".$fetch_data['user_id']."' and transaction_date='".$fetch_data['insert_date']."') limit 1");
					if(mysqli_num_rows($res_stock)>0)
					{
						$row_stock1 =  mysqli_fetch_assoc($res_stock);
						$pro_price=$row_stock1['product_price'];
						$pro_val=$row_stock1['product_id'];
					}
				}
				if($pro_price>0)
				{
					$ordquantiy= round($fetch_data['amount']/$pro_price,2);
					$uq1=mysqli_query($con,"UPDATE tbl_user_stock SET quantity=round(quantity-'$ordquantiy',2) where date ='".$fetch_data['insert_date']."' and user_id='".$fetch_data['user_id']."' and product_id='$pro_val'");
					$uq1=mysqli_query($con,"UPDATE tbl_user_stock SET quantity=round(quantity-'$ordquantiy',2),opening_stock=round(opening_stock-'$ordquantiy',2) where date >'".$fetch_data['insert_date']."' and user_id='".$fetch_data['user_id']."' and product_id='$pro_val'");
					$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);
					$query_return = mysqli_query($con,"insert into tbl_distributor_transaction(transaction_id,product_id, distributor_id,quantity, transaction_date, transaction_time,txn_type,user_id)values('$transaction_id','$pro_val','$session_dist_ver','$ordquantiy','".$fetch_data['insert_date']."','$scro','Return','".$fetch_data['user_id']."')");
					
					$uq11=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock+'$ordquantiy',2) where date='".$fetch_data['insert_date']."' and distributor_id='$session_dist_ver' and product_id='$pro_val'");	
					
					$uq12=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock+'$ordquantiy',2), opening_stock = round(opening_stock+'$ordquantiy',2) where date >'".$fetch_data['insert_date']."' and distributor_id='$session_dist_ver' and product_id='$pro_val'");	
					
					$uq21=mysqli_query($con,"update tbl_product set stock_quantity=round(stock_quantity+'$ordquantiy',2) where product_id='$pro_val' and distributor_id='$session_dist_ver'"); 
				}
				if($uq21)
				{
					$clear_cart=mysqli_query($con,"delete from tbl_autofill_retailer_message_detail WHERE distributor_id='$session_dist_ver' AND message_id='$dist_sg_id'");
				}
			}
		}
		$response['success']='1';
		$response['details']="Transaction Successfully Deleted!!";
	}
	else
	{
		$response['success']='0';
		$response['details']="Transaction Already Completed!!";
	}
	
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>