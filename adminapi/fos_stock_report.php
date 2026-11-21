<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['user_id']) && isset($_POST['cdate']) && isset($_POST['distributor_id']) && isset($_POST['work_type']))
{
	$cdate = $_POST['cdate'];
	$work_type = $_POST['work_type'];
	$temp_string=explode("-",$cdate);
	$temp_string2=(string)$temp_string[1];
	$temp_string3=(string)$temp_string[2];
	if(strlen($temp_string2)==1)
	{
		$temp_string2="0".$temp_string2;
	}
	if(strlen($temp_string3)==1)
	{
		$temp_string3="0".$temp_string3;
	}
	$temp_data_date=$temp_string[0]."-".$temp_string2."-".$temp_string3;
	$temp_date2=strtotime($temp_data_date);
	$cdate=date("Y-m-d",$temp_date2);
	$temp_user_id = $_POST['user_id'];
	$ver = $_POST['distributor_id'];
	$product=array();
	$opening_stock="";$stock_in="";$stock_out="";$closing_stock="";$stock_return="";
	$type_explode=explode('+',$work_type);
	$type_array='';
	for($i=0;$i<sizeof($type_explode);$i++)
	{
		if($type_explode[$i]!='')
		{
			if($i==0)
				$type_array="'".$type_explode[$i]."'";
			else
				$type_array=$type_array.",'".$type_explode[$i]."'";
		}
	}
	
	$bill_financial_year=mysqli_query($con,"SELECT * FROM tbl_distributor_previous_data_record where start_date<='$cdate' && end_date>='$cdate'");
	if(mysqli_num_rows($bill_financial_year)>0)
	{
		while($f_data_fetch=mysqli_fetch_assoc($bill_financial_year))
		{
			$extra_link1=$f_data_fetch['txn_table'];
			$extra_link2=$f_data_fetch['txn_detail_table'];
			$extra_link3=$f_data_fetch['purchase_txn_table'];
		}
	}
	
	$select_product1 = mysqli_query($con,"select product_id,product_name,product_price from tbl_product where status='Active' and distributor_id='$ver' and product_type in ($type_array)");
	$tamt_opening=0;
	$tamt_stockin=0;
	$tamt_stockout=0;
	$tamt_closing=0;
	if(mysqli_num_rows($select_product1)>0)
	{
	while($fetch_product1=mysqli_fetch_array($select_product1))
	{
		$tamt_opening=0;
		$tamt_closing=0;
		$tamt_preturn=0;
		$product_id=$fetch_product1['product_id'];
		$product_name=$fetch_product1['product_name'];
		$product_price=$fetch_product1['product_price'];
		$product_detail=mysqli_query($con,"SELECT date,opening_stock,quantity FROM tbl_user_stock where date<='$cdate' and user_id='$temp_user_id' and product_id='$product_id' order by date DESC limit 1");
		if(mysqli_num_rows($product_detail)>0)
		{     
			while($fetch_detail=mysqli_fetch_array($product_detail))
			{
				if($fetch_detail['date']==$cdate)
				{
					$opening_stock=$fetch_detail['opening_stock'];
					$closing_stock=$fetch_detail['quantity'];
				}
				else
				{
					$opening_stock=$fetch_detail['quantity'];
					$closing_stock=$fetch_detail['quantity'];
				}
																
				$stockin_detail=mysqli_query($con,"SELECT tbl_user_request_detail.quantity FROM tbl_user_request,tbl_user_request_detail where tbl_user_request.transaction_id=tbl_user_request_detail.transaction_id and tbl_user_request.complete_date='$cdate' and tbl_user_request.user_id='$temp_user_id' and tbl_user_request_detail.product_id='$product_id' and tbl_user_request.status='Complete'");
				$temp_stockin=0;
				if(mysqli_num_rows($stockin_detail)>0)
				{     
					while($fetch_stockin=mysqli_fetch_array($stockin_detail))
					{
						$temp_stockin=$temp_stockin+$fetch_stockin['quantity'];
					}
					$stock_in=$temp_stockin;
				}
				else
				{
					$stock_in=$temp_stockin;
				}
				$stockout_detail=mysqli_query($con,"SELECT ".$extra_link2.".quantity FROM ".$extra_link1.", ".$extra_link2." where ".$extra_link1.".transaction_id=".$extra_link2.".transaction_id and ".$extra_link1.".transaction_date='$cdate' and ".$extra_link1.".transaction_from='$temp_user_id' and ".$extra_link2.".product_id='$product_id' and source=''");
				$temp_stockout=0;
				if(mysqli_num_rows($stockout_detail)>0)
				{     
					while($fetch_stockout=mysqli_fetch_array($stockout_detail))
					{
						$temp_stockout=$temp_stockout+$fetch_stockout['quantity'];
					}
					$stock_out=$temp_stockout;
				}
				else
				{
					$stock_out=$temp_stockout;
				}
				$stockreturn_detail=mysqli_query($con,"SELECT quantity FROM ".$extra_link3." where distributor_id='$ver' and transaction_date='$cdate' and user_id='$temp_user_id' and product_id='$product_id' and txn_type='Return'");
				$temp_stockreturn=0;
				if(mysqli_num_rows($stockreturn_detail)>0)
				{     
					while($fetch_stockreturn=mysqli_fetch_array($stockreturn_detail))
					{
						$temp_stockreturn=$temp_stockreturn+$fetch_stockreturn['quantity'];
					}
					$stock_return=$temp_stockreturn;
				}
				else
				{
					$stock_return=$temp_stockreturn;
				}	


				$stockcancel_sale = mysqli_query($con, "SELECT tbl_bill_cancel_detail.quantity, tbl_bill_cancel_detail.free_qty FROM tbl_bill_cancel, tbl_bill_cancel_detail where tbl_bill_cancel.transaction_id = tbl_bill_cancel_detail.transaction_id and tbl_bill_cancel.transaction_date='$cdate' and tbl_bill_cancel.converted_transaction_id='' and tbl_bill_cancel.transaction_from='$temp_user_id' and tbl_bill_cancel_detail.product_id='$product_id' and tbl_bill_cancel.source='' and tbl_bill_cancel.stock_add='Admin'");
				$temp_stockcancel_sale = 0;
				if (mysqli_num_rows($stockcancel_sale) > 0) {
					while ($fetch_stock_sale = mysqli_fetch_array($stockcancel_sale)) {
						$temp_stockcancel_sale = $temp_stockcancel_sale + $fetch_stock_sale['quantity'] + $fetch_stock_sale['free_qty'];
					}
				}
				
			} 
		}
		$product['Product_Name']=$product_name;
		if($opening_stock=="")
			$product['opening_stock']='-';
		else
			$product['opening_stock']=$opening_stock;
		if($stock_in=="")
			$product['stock_in']='-';
		else
			$product['stock_in']=$stock_in;
		if($stock_out=="")
			$product['stock_out']='-';
		else
			$product['stock_out']=$stock_out;
		if($stock_return=="")
			$product['stock_return']='-';
		else
			$product['stock_return']=$stock_return;
		if($temp_stockcancel_sale=="")
			$product['bill_cancel_stock']='-';
		else
			$product['bill_cancel_stock']=$temp_stockcancel_sale;
		
		
		if($closing_stock=="")
			$product['closing_stock']='-';
		else
			$product['closing_stock']=$closing_stock;
		$response['stockDetail'][]=$product;
		$opening_stock="";$stock_in="";$stock_out="";$closing_stock="";$stock_return="";
	}
	$response['success']='1';
	$response['details']="Fetch Detail Successful";
	}
	else
	{
		$response['success']='0';
		$response['details']="FOS has no stock";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>