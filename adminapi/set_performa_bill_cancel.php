<?php
include("../../connect.php");
$response = array();
if(isset($_POST['txn_id']) && isset($_POST['distributor_id']))
{
	$session_dist_ver=$_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("h:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$id1=$_POST['txn_id'];
	$res = mysqli_query($con,"select * from tbl_party_transaction_performa where transaction_id='$id1' and status='Pending'");
	if(mysqli_num_rows($res)>0)
	{
		$fetch_update=mysqli_fetch_assoc($res);
		$txn_date=$fetch_update['transaction_date'];
		
		if($fetch_update['invoice_type']=='Performa Invoice')
		{
			$res_detail_other = mysqli_query($con,"SELECT * FROM tbl_party_transaction_detail_performa_other WHERE transaction_id='$id1'");
			if(mysqli_num_rows($res_detail_other)>0) 
			{     
				while($fetch_data_other=mysqli_fetch_assoc($res_detail_other)) 
				{
					$feth_pro=$fetch_data_other['product_id'];
					$temp_11=$fetch_data_other['quantity'];
					$other_date=$fetch_data_other['insert_date'];
					if($fetch_data_other['txn_type']=='Add')
					{
						$final_qty=$final_qty+$fetch_data_other['quantity']; 
						$uq_check=mysqli_query($con,"select * from tbl_product where product_id='$feth_pro' and maintain_inventory='Yes'");
						if(mysqli_num_rows($uq_check)>0)
						{
							$uq21=mysqli_query($con,"update tbl_distributor_stock set closing_stock=round(closing_stock+'$temp_11',2) where product_id='$feth_pro' and distributor_id='$session_dist_ver' and date ='$other_date'");
							$uq_21=mysqli_query($con,"update tbl_distributor_stock set closing_stock=round(closing_stock+'$temp_11',2),opening_stock = round(opening_stock+'$temp_11',2) where product_id='$feth_pro' and distributor_id='$session_dist_ver' and date>'$other_date'");
							$uq_22=mysqli_query($con,"update tbl_product set stock_quantity=round(stock_quantity+'$temp_11',2) where product_id='$feth_pro' and distributor_id='$session_dist_ver'");
						}
					}
					else
					{
						$uq_check=mysqli_query($con,"select * from tbl_product where product_id='$feth_pro' and maintain_inventory='Yes'");
						if(mysqli_num_rows($uq_check)>0)
						{
							$uq21=mysqli_query($con,"update tbl_distributor_stock set closing_stock=round(closing_stock-'$temp_11',2) where product_id='$feth_pro' and distributor_id='$session_dist_ver' and date ='$other_date'");
							$uq_21=mysqli_query($con,"update tbl_distributor_stock set closing_stock=round(closing_stock-'$temp_11',2),opening_stock = round(opening_stock-'$temp_11',2) where product_id='$feth_pro' and distributor_id='$session_dist_ver' and date>'$other_date'");
							$uq_22=mysqli_query($con,"update tbl_product set stock_quantity=round(stock_quantity-'$temp_11',2) where product_id='$feth_pro' and distributor_id='$session_dist_ver'");
						}
					}
				}
			}
			$update_result = mysqli_query($con,"select * from tbl_party_transaction_detail_performa where transaction_id='$id1'");
			while($fetch_update=mysqli_fetch_assoc($update_result))
			{
				$feth_pro=$fetch_update['product_id'];
				$temp_11=$fetch_update['quantity'];
				$status_stock_update='1';
				$uq_check=mysqli_query($con,"select * from tbl_product where product_id='$feth_pro' and maintain_inventory='Yes'");
				if(mysqli_num_rows($uq_check)>0)
				{
					$uq21=mysqli_query($con,"update tbl_distributor_stock set closing_stock=round(closing_stock+'$temp_11',2) where product_id='$feth_pro' and distributor_id='$session_dist_ver' and date ='$txn_date'");
					$uq_21=mysqli_query($con,"update tbl_distributor_stock set closing_stock=round(closing_stock+'$temp_11',2),opening_stock = round(opening_stock+'$temp_11',2) where product_id='$feth_pro' and distributor_id='$session_dist_ver' and date>'$txn_date'");
					$uq_22=mysqli_query($con,"update tbl_product set stock_quantity=round(stock_quantity+'$temp_11',2) where product_id='$feth_pro' and distributor_id='$session_dist_ver'");
				}
			}
			if($status_stock_update=='1')
			{
				$resd1 = mysqli_query($con,"update tbl_party_transaction_performa set status='Deleted' where transaction_id='$id1'");
			}
		}
		else
		{
			$resd1 = mysqli_query($con,"update tbl_party_transaction_performa set status='Deleted' where transaction_id='$id1'");
		}
	}
	if($resd1)
	{
		$response['success']='1';
		$response['details']="Bill Successfully Cancelled";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>